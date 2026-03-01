import express, { Router, Response, NextFunction } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db, auth } from '../config/firebase.js';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
    registerStudentSchema,
    registerAlumniSchema,
    updateProfileSchema,
} from '../utils/validators.js';
import { isWhitelistedAdmin } from '../config/adminWhitelist.js';

const router: Router = express.Router();

// Get admin whitelist
const getAdminWhitelist = async () => {
    try {
        const doc = await db.collection('config').doc('adminWhitelist').get();
        return doc.exists ? (doc.data()?.emails || []) : [];
    } catch (error: any) {
        console.error('Error fetching admin whitelist:', error);
        return [];
    }
};

// ✅ Register Student (POST /api/users/register-student)
router.post('/register-student', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        if (!uid) throw new ApiError('User not authenticated', 401);

        // Validate input
        const result = registerStudentSchema.safeParse(req.body);
        if (!result.success) {
            throw new ApiError(
                `Validation failed: ${result.error.errors[0]?.message}`,
                400,
                'invalid-argument'
            );
        }
        const parsed = result.data;

        // Check if user already has a role
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims?.role) {
            throw new ApiError('User already registered', 409, 'already-exists');
        }

        // Check if email is whitelisted for admin
        const whitelist = await getAdminWhitelist();
        const isAdmin = whitelist.includes(parsed.email);
        const role = isAdmin ? 'admin' : 'student';

        // Set custom claims
        await auth.setCustomUserClaims(uid, { role, status: 'active' });

        // Create Firestore documents
        const batch = db.batch();

        const userRef = db.collection('users').doc(uid);
        batch.set(userRef, {
            role,
            status: 'active',
            email: parsed.email,
            tenantId: parsed.tenantId,
            createdAt: FieldValue.serverTimestamp(),
        });

        const profileRef = db.collection('profiles').doc(uid);
        batch.set(profileRef, {
            userId: uid,
            displayName: parsed.displayName,
            email: parsed.email,
            branch: parsed.branch,
            division: parsed.division,
            rollNo: parsed.rollNo,
            prnNo: parsed.prnNo,
            year: parsed.year,
            bio: parsed.bio || '',
            skills: parsed.skills || [],
            address: parsed.address || '',
            socialLinks: parsed.socialLinks || {},
            codingProfiles: parsed.codingProfiles || {},
            resumeUrl: parsed.resumeUrl || '',
            profilePicUrl: parsed.profilePicUrl || '',
            visibility: 'public',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        res.json({ success: true, message: 'Student registered successfully' });
    } catch (error) {
        next(error);
    }
});

// ✅ Register Alumni (POST /api/users/register-alumni)
router.post('/register-alumni', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        if (!uid) throw new ApiError('User not authenticated', 401);

        const result = registerAlumniSchema.safeParse(req.body);
        if (!result.success) {
            throw new ApiError(
                `Validation failed: ${result.error.errors[0]?.message}`,
                400,
                'invalid-argument'
            );
        }
        const parsed = result.data;

        // Check if already has role
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims?.role && userRecord.customClaims.role !== 'student') {
            throw new ApiError('User already registered as ' + userRecord.customClaims.role, 409);
        }

        // Update custom claims
        await auth.setCustomUserClaims(uid, { role: 'alumni', status: 'pending' });

        // Create user and profile documents
        const batch = db.batch();

        const userRef = db.collection('users').doc(uid);
        batch.set(
            userRef,
            {
                role: 'alumni',
                status: 'pending',
                email: parsed.email,
                tenantId: parsed.tenantId,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        const profileRef = db.collection('profiles').doc(uid);
        batch.set(
            profileRef,
            {
                userId: uid,
                displayName: parsed.displayName,
                email: parsed.email,
                company: parsed.company,
                role: parsed.role,
                gradYear: parsed.gradYear,
                expertise: parsed.expertise,
                bio: parsed.bio || '',
                socialLinks: parsed.socialLinks || {},
                address: parsed.address || '',
                resumeUrl: parsed.resumeUrl || '',
                profilePicUrl: parsed.profilePicUrl || '',
                privacySettings: parsed.privacySettings || {},
                visibility: 'public',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        // Create alumniMeta with opt-in preferences (SINGLE SOURCE OF TRUTH)
        const alumniMetaRef = db.collection('alumniMeta').doc(uid);
        batch.set(alumniMetaRef, {
            userId: uid,
            mentorOptIn: parsed.mentorOptIn || true,
            referralOptIn: parsed.referralOptIn || false,
            createdAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        res.json({ success: true, message: 'Alumni registration submitted. Awaiting admin approval.' });
    } catch (error) {
        next(error);
    }
});

// ✅ Get Profile (GET /api/users/profile)
router.get('/profile', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        if (!uid) throw new ApiError('User not authenticated', 401);

        const profileDoc = await db.collection('profiles').doc(uid).get();
        if (!profileDoc.exists) {
            throw new ApiError('Profile not found', 404);
        }

        res.json(profileDoc.data());
    } catch (error) {
        next(error);
    }
});

// ✅ Update Profile (PATCH /api/users/profile)
// Status enforcement: Can only update toggles if status == 'active'
// Single source of truth: mentorOptIn/referralOptIn stored ONLY in alumniMeta
router.patch('/profile', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        if (!uid) throw new ApiError('User not authenticated', 401);

        const result = updateProfileSchema.safeParse(req.body);
        if (!result.success) {
            throw new ApiError(
                `Validation failed: ${result.error.errors[0]?.message}`,
                400,
                'invalid-argument'
            );
        }

        const { mentorOptIn, referralOptIn, ...profileData } = result.data;

        // Use transaction for atomicity
        await db.runTransaction(async (transaction) => {
            // Get user to check status
            const userRef = db.collection('users').doc(uid);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
                throw new ApiError('User not found', 404);
            }

            const userData = userDoc.data();

            // Check if updating toggles and enforce status == 'active'
            if ((mentorOptIn !== undefined || referralOptIn !== undefined) && userData?.status !== 'active') {
                throw new ApiError(
                    'Can only modify mentorship settings when account is active',
                    403,
                    'status-not-active'
                );
            }

            // Update profile with non-toggle fields only
            const profileRef = db.collection('profiles').doc(uid);
            transaction.update(profileRef, {
                ...profileData,
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Update alumniMeta with toggles ONLY (single source of truth)
            if (mentorOptIn !== undefined || referralOptIn !== undefined) {
                const alumniMetaRef = db.collection('alumniMeta').doc(uid);
                const updateData: any = {};
                
                if (mentorOptIn !== undefined) {
                    updateData.mentorOptIn = mentorOptIn;
                }
                if (referralOptIn !== undefined) {
                    updateData.referralOptIn = referralOptIn;
                }

                transaction.update(alumniMetaRef, updateData);

                // Log toggle changes
                const activityRef = userRef.collection('activity').doc();
                transaction.set(activityRef, {
                    type: 'settings_changed',
                    timestamp: new Date(),
                    changes: updateData,
                    details: {
                        fieldChanged: Object.keys(updateData),
                        mentorOptIn: mentorOptIn !== undefined ? mentorOptIn : null,
                        referralOptIn: referralOptIn !== undefined ? referralOptIn : null,
                    }
                });
            }
        });

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
});

// ✅ Get Activity History (GET /api/users/activity)
router.get('/activity', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        if (!uid) throw new ApiError('User not authenticated', 401);

        const snapshot = await db
            .collection('users')
            .doc(uid)
            .collection('activity')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        const activities = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(activities);
    } catch (error) {
        next(error);
    }
});

export default router;
