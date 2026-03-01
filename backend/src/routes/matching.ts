import express, { Router, Response, NextFunction } from 'express';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

const router: Router = express.Router();

/**
 * ✅ Get Recommended Mentors (GET /api/matching/recommended-mentors)
 * 
 * Matching Algorithm:
 * - Input: Student's skills array
 * - Factors:
 *   1. Skill overlap relevance (primary)
 *   2. Years of experience (graduation year)
 *   3. Alumni average rating (if available)
 *   4. Must have mentorOptIn = true
 *   5. Must have status = 'active'
 * 
 * Output: Top 3 recommended alumni, sorted by score
 * 
 * Query Parameters:
 *   - skills: comma-separated list of skills to match (e.g., "React,Node.js,AWS")
 */
router.get('/recommended-mentors', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get student's skills
        const studentDoc = await db.collection('profiles').doc(uid).get();
        if (!studentDoc.exists) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        const studentSkills = studentDoc.data()?.skills || [];
        if (studentSkills.length === 0) {
            return res.json({
                message: 'Add skills to your profile to get personalized mentor recommendations',
                recommendedAlumni: []
            });
        }

        const studentSkillsSet = new Set(studentSkills.map((s: string) => s.toLowerCase()));

        // Get all active alumni with mentoring enabled
        const alumniSnapshot = await db.collection('users')
            .where('role', '==', 'alumni')
            .where('status', '==', 'active')
            .get();

        // Score each alumnus
        const scoredAlumni: any[] = [];

        for (const alumniDoc of alumniSnapshot.docs) {
            const alumniId = alumniDoc.id;
            const alumniData = alumniDoc.data();

            // Get alumniMeta to check mentorOptIn
            const alumniMetaDoc = await db.collection('alumniMeta').doc(alumniId).get();
            if (!alumniMetaDoc.exists || !alumniMetaDoc.data()?.mentorOptIn) {
                continue; // Skip alumni not available for mentoring
            }

            // Get full profile
            const profileDoc = await db.collection('profiles').doc(alumniId).get();
            if (!profileDoc.exists) {
                continue;
            }

            const profile = profileDoc.data();
            const alumniMeta = alumniMetaDoc.data();

            // Calculate skill match score
            const alumniSkills = profile?.expertise || [];
            const alumniSkillsSet = new Set(alumniSkills.map((s: string) => s.toLowerCase()));

            let skillMatchScore = 0;
            for (const skill of studentSkillsSet) {
                if (alumniSkillsSet.has(skill)) {
                    skillMatchScore += 1;
                }
            }

            // Normalize skill match (0-1 scale, weight: 50%)
            const normalizedSkillMatch = alumniSkills.length > 0 
                ? (skillMatchScore / Math.min(studentSkills.length, alumniSkills.length)) * 0.5
                : 0;

            // Experience score based on graduation year (0-1 scale, weight: 25%)
            const currentYear = new Date().getFullYear();
            const yearsOfExp = Math.max(0, currentYear - (alumniData?.gradYear || currentYear));
            const maxExp = 20; // Consider 20+ years as maximum
            const experienceScore = Math.min(yearsOfExp / maxExp, 1) * 0.25;

            // Rating score from alumniMeta (0-1 scale, weight: 25%)
            const averageRating = alumniMeta?.averageStudentRating || 0;
            const ratingScore = Math.min(averageRating / 5, 1) * 0.25;

            // Total score
            const totalScore = normalizedSkillMatch + experienceScore + ratingScore;

            if (totalScore > 0) {
                scoredAlumni.push({
                    uid: alumniId,
                    displayName: profile?.displayName,
                    company: profile?.company,
                    role: profile?.role,
                    bio: profile?.bio,
                    profilePicUrl: profile?.profilePicUrl,
                    expertise: profile?.expertise,
                    gradYear: alumniData?.gradYear,
                    yearsOfExperience: yearsOfExp,
                    averageRating: averageRating,
                    matchScore: totalScore,
                    skillMatches: Array.from(studentSkillsSet).filter(s => alumniSkillsSet.has(s))
                });
            }
        }

        // Sort by score (descending) and return top 3
        const topMatches = scoredAlumni
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 3);

        res.json({
            recommendedAlumni: topMatches,
            totalMatches: scoredAlumni.length,
            your_skills: Array.from(studentSkillsSet)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * ✅ Get All Available Mentors (GET /api/matching/available-mentors)
 * 
 * Simple list of all active alumni available for mentoring (no scoring)
 * Used for browsing or when algorithm filtering not needed
 */
router.get('/available-mentors', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Get all active alumni with mentoring enabled
        const alumniSnapshot = await db.collection('users')
            .where('role', '==', 'alumni')
            .where('status', '==', 'active')
            .get();

        const availableMentors: any[] = [];

        for (const alumniDoc of alumniSnapshot.docs) {
            const alumniId = alumniDoc.id;
            const alumniData = alumniDoc.data();

            // Check mentorOptIn
            const alumniMetaDoc = await db.collection('alumniMeta').doc(alumniId).get();
            if (!alumniMetaDoc.exists || !alumniMetaDoc.data()?.mentorOptIn) {
                continue;
            }

            // Get profile
            const profileDoc = await db.collection('profiles').doc(alumniId).get();
            if (!profileDoc.exists) {
                continue;
            }

            const profile = profileDoc.data();
            const alumniMeta = alumniMetaDoc.data();

            availableMentors.push({
                uid: alumniId,
                displayName: profile?.displayName,
                company: profile?.company,
                role: profile?.role,
                bio: profile?.bio,
                profilePicUrl: profile?.profilePicUrl,
                expertise: profile?.expertise,
                gradYear: alumniData?.gradYear,
                averageRating: alumniMeta?.averageStudentRating || 0,
                socialLinks: profile?.socialLinks
            });
        }

        // Sort by average rating (descending)
        const sorted = availableMentors.sort((a, b) => b.averageRating - a.averageRating);

        res.json({
            availableMentors: sorted,
            totalAvailable: sorted.length
        });
    } catch (error) {
        next(error);
    }
});

export default router;
