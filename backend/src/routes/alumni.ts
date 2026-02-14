import express, { Router, Response, NextFunction } from 'express';
import { optionalAuth, AuthRequest, verifyFirebaseToken } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { ApiError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

// ✅ Get Alumni Stats (GET /api/alumni/stats)
router.get('/stats', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Count alumni users
        const alumniSnapshot = await db.collection('users')
            .where('role', '==', 'alumni')
            .get();

        // Get recent announcements
        const announcementSnapshot = await db.collection('announcements')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        const announcements = announcementSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        res.json({
            totalAlumni: alumniSnapshot.size,
            recentAnnouncements: announcements,
            statsUpdatedAt: new Date()
        });
    } catch (error) {
        next(error);
    }
});

// ✅ Get Individual Alumni Analytics (GET /api/alumni/:uid/analytics)
// Self-view or admin view of personal mentorship analytics
router.get('/:uid/analytics', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { uid } = req.params;
        const requestingUserId = req.user?.uid;

        // Allow self-view or admin view
        const isAdmin = requestingUserId === uid || (await isUserAdmin(requestingUserId));
        if (!isAdmin) {
            return res.status(403).json({ error: 'Unauthorized to view these analytics' });
        }

        // Check user is alumni
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'alumni') {
            return res.status(404).json({ error: 'Alumni not found' });
        }

        // Calculate mentorship statistics
        // 1. Total mentees (unique students who have had accepted guidance requests with this alumni)
        const guidanceSnapshot = await db.collection('guidance_requests')
            .where('acceptedBy', '==', uid)
            .where('status', 'in', ['accepted', 'replied'])
            .get();

        const uniqueMentees = new Set(guidanceSnapshot.docs.map((doc: any) => doc.data().requestedBy));
        const totalMentees = uniqueMentees.size;

        // 2. Response rate (replied / accepted + replied)
        const repliedCount = guidanceSnapshot.docs.filter((doc: any) => doc.data().status === 'replied').length;
        const responseRate = guidanceSnapshot.size > 0 ? (repliedCount / guidanceSnapshot.size) * 100 : 0;

        // 3. Average rating (from alumniMeta if available)
        const alumniMetaDoc = await db.collection('alumniMeta').doc(uid).get();
        const avgRating = alumniMetaDoc.exists ? (alumniMetaDoc.data()?.averageStudentRating || 0) : 0;

        // 4. Last active date (from activity logs)
        const activitySnapshot = await db.collection('users')
            .doc(uid)
            .collection('activity')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        const lastActiveDate = activitySnapshot.docs.length > 0
            ? activitySnapshot.docs[0].data().timestamp?.toDate?.() || new Date()
            : userDoc.data()?.createdAt?.toDate?.() || new Date();

        // 5. Referral count
        const referralSnapshot = await db.collection('referrals')
            .where('createdBy', '==', uid)
            .get();

        const totalReferrals = referralSnapshot.size;
        const openReferrals = referralSnapshot.docs.filter((doc: any) => doc.data().status === 'open').length;

        // 6. Active mentorship relationships
        const totalRequests = guidanceSnapshot.size;

        // 7. Total posts
        const postsSnapshot = await db.collection('posts')
            .where('createdBy', '==', uid)
            .get();

        const totalPosts = postsSnapshot.size;

        // Fetch profile name
        const profileDoc = await db.collection('profiles').doc(uid).get();
        const displayName = profileDoc.exists ? profileDoc.data()?.displayName : 'Alumni';

        res.json({
            displayName,
            mentorshipAnalytics: {
                totalMentees,
                totalMentorshipRequests: totalRequests,
                acceptedRequests: guidanceSnapshot.size,
                repliedRequests: repliedCount,
                responseRate: Math.round(responseRate * 100) / 100, // Round to 2 decimals
                averageStudentRating: avgRating,
                lastMentorshipActivity: guidanceSnapshot.docs.length > 0
                    ? guidanceSnapshot.docs[0].data().acceptedAt?.toDate?.() || new Date()
                    : null
            },
            referralAnalytics: {
                totalReferralsCreated: totalReferrals,
                openReferrals,
                closedReferrals: totalReferrals - openReferrals
            },
            communityContribution: {
                totalPostsCreated: totalPosts,
                lastActiveDate
            },
            generatedAt: new Date()
        });
    } catch (error) {
        next(error);
    }
});

// ✅ Get Alumni Leaderboard (GET /api/alumni/leaderboard)
// Public view: rank alumni by mentorship impact and community contribution
router.get('/leaderboard', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Get all active alumni
        const alumniSnapshot = await db.collection('users')
            .where('role', '==', 'alumni')
            .where('status', '==', 'active')
            .get();

        const leaderboardData: any[] = [];

        // Calculate score for each alumnus
        for (const alumniDoc of alumniSnapshot.docs) {
            const uid = alumniDoc.id;
            const userData = alumniDoc.data();

            // Get mentorship count
            const guidanceSnapshot = await db.collection('guidance_requests')
                .where('acceptedBy', '==', uid)
                .get();

            // Get rating
            const alumniMetaDoc = await db.collection('alumniMeta').doc(uid).get();
            const rating = alumniMetaDoc.exists ? (alumniMetaDoc.data()?.averageStudentRating || 0) : 0;

            // Get activity count
            const activitySnapshot = await db.collection('users')
                .doc(uid)
                .collection('activity')
                .get();

            // Get posts count
            const postsSnapshot = await db.collection('posts')
                .where('createdBy', '==', uid)
                .get();

            // Calculate composite score
            const mentorshipScore = guidanceSnapshot.size * 10; // 10 points per mentee
            const ratingScore = rating * 20; // 20 points per rating point
            const activityScore = Math.min(activitySnapshot.size, 100); // Max 100 points for activity
            const communityScore = postsSnapshot.size * 5; // 5 points per post

            const totalScore = mentorshipScore + ratingScore + activityScore + communityScore;

            if (totalScore > 0) {
                // Get profile for display info
                const profileDoc = await db.collection('profiles').doc(uid).get();
                const profile = profileDoc.data();

                leaderboardData.push({
                    uid,
                    displayName: profile?.displayName || 'Alumni',
                    company: profile?.company,
                    profilePicUrl: profile?.profilePicUrl,
                    totalScore: Math.round(totalScore),
                    menteeCount: guidanceSnapshot.size,
                    averageRating: rating,
                    postCount: postsSnapshot.size,
                    activityCount: activitySnapshot.size
                });
            }
        }

        // Sort by score descending
        const sorted = leaderboardData.sort((a, b) => b.totalScore - a.totalScore);

        // Add rank
        const rankedLeaderboard = sorted.map((item, index) => ({
            ...item,
            rank: index + 1
        }));

        res.json({
            leaderboard: rankedLeaderboard.slice(0, 50), // Top 50
            totalAlumni: rankedLeaderboard.length,
            generatedAt: new Date()
        });
    } catch (error) {
        next(error);
    }
});

// Helper function to check if user is admin
async function isUserAdmin(uid?: string): Promise<boolean> {
    if (!uid) return false;
    try {
        const doc = await db.collection('config').doc('adminWhitelist').get();
        const whitelist = doc.exists ? (doc.data()?.emails || []) : [];
        
        const userDoc = await db.collection('users').doc(uid).get();
        const userEmail = userDoc.exists ? userDoc.data()?.email : null;
        
        return userEmail && whitelist.includes(userEmail);
    } catch {
        return false;
    }
}

export default router;
