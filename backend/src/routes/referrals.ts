import express, { Router, Response, NextFunction } from 'express';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { ApiError } from '../middleware/errorHandler.js';

const router: Router = express.Router();

/**
 * ✅ Create Referral (POST /api/referrals)
 * 
 * Prerequisites:
 * - User must be alumni
 * - User status must be 'active'
 * - User must have referralOptIn = true
 * 
 * Request body:
 * {
 *   company: string
 *   role: string
 *   description: string
 *   requirements?: string[]
 *   salary_range?: { min: number, max: number }
 * }
 */
router.post('/', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        if (!uid) throw new ApiError('User not authenticated', 401);

        const { company, role, description } = req.body;

        // Validate required fields
        if (!company || !role || !description) {
            throw new ApiError('company, role, and description are required', 400);
        }

        // Check user is alumni and active
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new ApiError('User not found', 404);
        }

        const userData = userDoc.data();
        if (userData?.role !== 'alumni') {
            throw new ApiError('Only alumni can create referrals', 403);
        }
        if (userData?.status !== 'active') {
            throw new ApiError('Account must be active to create referrals', 403);
        }

        // Check referralOptIn is enabled
        const alumniMetaDoc = await db.collection('alumniMeta').doc(uid).get();
        if (!alumniMetaDoc.exists || !alumniMetaDoc.data()?.referralOptIn) {
            throw new ApiError('Referral opt-in must be enabled', 403);
        }

        // Create referral document
        const referralRef = await db.collection('referrals').add({
            createdBy: uid,
            createdByName: userData?.displayName || 'Anonymous',
            company,
            role,
            description,
            requirements: req.body.requirements || [],
            salaryRange: req.body.salary_range || null,
            status: 'open',
            applicants: [],
            applicantCount: 0,
            acceptedApplicant: null,
            createdAt: new Date(),
            closedAt: null
        });

        // Log activity
        await db.collection('users').doc(uid).collection('activity').add({
            type: 'referral_created',
            referralId: referralRef.id,
            company,
            role,
            timestamp: new Date(),
            details: {
                referralId: referralRef.id,
                company,
                role
            }
        });

        res.json({
            success: true,
            message: 'Referral created successfully',
            referralId: referralRef.id
        });
    } catch (error) {
        next(error);
    }
});

/**
 * ✅ Apply to Referral (POST /api/referrals/:referralId/apply)
 * 
 * Prerequisites:
 * - User must be a student
 * - User must not be suspended or blocked
 * - Student can only apply once per referral
 */
router.post('/:referralId/apply', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        const { referralId } = req.params;

        if (!uid) throw new ApiError('User not authenticated', 401);

        // Get referral
        const referralDoc = await db.collection('referrals').doc(referralId).get();
        if (!referralDoc.exists) {
            throw new ApiError('Referral not found', 404);
        }

        const referralData = referralDoc.data();

        // Check referral is open
        if (referralData?.status !== 'open') {
            throw new ApiError('This referral is not open for applications', 400);
        }

        // Get user details
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new ApiError('User not found', 404);
        }

        const userData = userDoc.data();

        // Check user is student
        if (userData?.role !== 'student') {
            throw new ApiError('Only students can apply to referrals', 403);
        }

        // Check user is not suspended or blocked
        if (userData?.status === 'suspended' || userData?.status === 'blocked') {
            throw new ApiError('Cannot apply while suspended or blocked', 403);
        }

        // Check duplicate application
        const applicants = referralData?.applicants || [];
        if (applicants.some((a: any) => a.studentId === uid)) {
            throw new ApiError('You have already applied to this referral', 400);
        }

        // Get student profile
        const profileDoc = await db.collection('profiles').doc(uid).get();
        const profile = profileDoc.data();

        // Use transaction for atomicity
        await db.runTransaction(async (transaction) => {
            const referralRef = db.collection('referrals').doc(referralId);
            const referralDoc = await transaction.get(referralRef);

            if (!referralDoc.exists) {
                throw new Error('Referral not found');
            }

            const applicantsList = referralDoc.data()?.applicants || [];

            // Add applicant
            const newApplicant = {
                studentId: uid,
                studentName: profile?.displayName || 'Anonymous',
                appliedAt: new Date(),
                status: 'pending',
                resumeUrl: profile?.resumeUrl || null
            };

            transaction.update(referralRef, {
                applicants: [...applicantsList, newApplicant],
                applicantCount: (referralDoc.data()?.applicantCount || 0) + 1
            });

            // Log activity for student
            const studentActivityRef = db.collection('users').doc(uid).collection('activity').doc();
            transaction.set(studentActivityRef, {
                type: 'referral_applied',
                referralId,
                company: referralDoc.data()?.company,
                role: referralDoc.data()?.role,
                timestamp: new Date(),
                details: {
                    referralId,
                    company: referralDoc.data()?.company,
                    role: referralDoc.data()?.role,
                    alumni: referralDoc.data()?.createdByName
                }
            });

            // Log activity for alumni
            const alumniActivityRef = db.collection('users')
                .doc(referralDoc.data()?.createdBy)
                .collection('activity')
                .doc();
            transaction.set(alumniActivityRef, {
                type: 'referral_application_received',
                referralId,
                studentId: uid,
                studentName: profile?.displayName,
                timestamp: new Date(),
                details: {
                    applicantCount: (referralDoc.data()?.applicantCount || 0) + 1
                }
            });
        });

        res.json({
            success: true,
            message: 'Application submitted successfully',
            referralId
        });
    } catch (error) {
        next(error);
    }
});

/**
 * ✅ Get Referrals (GET /api/referrals)
 * 
 * Query params:
 * - type: 'open' | 'created' | 'applied'
 * - status: the current status filter
 */
router.get('/', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        if (!uid) throw new ApiError('User not authenticated', 401);

        const type = (req.query.type as string) || 'open';

        let referrals: any[] = [];

        if (type === 'open') {
            // Get all open referrals
            const snapshot = await db.collection('referrals')
                .where('status', '==', 'open')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            referrals = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            }));
        } else if (type === 'created') {
            // Get referrals created by current user
            const snapshot = await db.collection('referrals')
                .where('createdBy', '==', uid)
                .orderBy('createdAt', 'desc')
                .get();

            referrals = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            }));
        } else if (type === 'applied') {
            // Get all referrals and filter client-side for applications
            const snapshot = await db.collection('referrals')
                .orderBy('createdAt', 'desc')
                .get();

            referrals = snapshot.docs
                .filter((doc: any) => {
                    const applicants = doc.data().applicants || [];
                    return applicants.some((a: any) => a.studentId === uid);
                })
                .map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                    myApplicationStatus: doc.data().applicants?.find((a: any) => a.studentId === uid)?.status
                }));
        }

        res.json(referrals);
    } catch (error) {
        next(error);
    }
});

/**
 * ✅ Update Referral Application Status (PATCH /api/referrals/:referralId/applicant/:studentId)
 * 
 * Only alumni who created the referral can update applicant status
 * 
 * Body:
 * {
 *   status: 'pending' | 'accepted' | 'rejected'
 * }
 */
router.patch('/:referralId/applicant/:studentId', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        const { referralId, studentId } = req.params;
        const { status } = req.body;

        if (!uid) throw new ApiError('User not authenticated', 401);

        if (!['pending', 'accepted', 'rejected'].includes(status)) {
            throw new ApiError('Invalid status', 400);
        }

        // Get referral
        const referralDoc = await db.collection('referrals').doc(referralId).get();
        if (!referralDoc.exists) {
            throw new ApiError('Referral not found', 404);
        }

        const referralData = referralDoc.data();

        // Verify user created the referral
        if (referralData?.createdBy !== uid) {
            throw new ApiError('Only the referral creator can update applicant status', 403);
        }

        // Use transaction for atomicity
        await db.runTransaction(async (transaction) => {
            const referralRef = db.collection('referrals').doc(referralId);
            const referralDoc = await transaction.get(referralRef);

            if (!referralDoc.exists) {
                throw new Error('Referral not found');
            }

            // Find and update applicant
            const applicants = referralDoc.data()?.applicants || [];
            const updatedApplicants = applicants.map((a: any) => {
                if (a.studentId === studentId) {
                    return { ...a, status };
                }
                return a;
            });

            transaction.update(referralRef, {
                applicants: updatedApplicants,
                ...(status === 'accepted' && { acceptedApplicant: studentId })
            });

            // Log activity for student
            const studentActivityRef = db.collection('users')
                .doc(studentId)
                .collection('activity')
                .doc();
            transaction.set(studentActivityRef, {
                type: 'referral_status_updated',
                referralId,
                newStatus: status,
                timestamp: new Date(),
                details: {
                    referralId,
                    company: referralDoc.data()?.company,
                    newStatus: status
                }
            });
        });

        res.json({
            success: true,
            message: `Applicant status updated to ${status}`,
            referralId
        });
    } catch (error) {
        next(error);
    }
});

/**
 * ✅ Close Referral (PATCH /api/referrals/:referralId/close)
 * 
 * Only creator can close their referral
 */
router.patch('/:referralId/close', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const uid = req.user?.uid;
        const { referralId } = req.params;

        if (!uid) throw new ApiError('User not authenticated', 401);

        const referralDoc = await db.collection('referrals').doc(referralId).get();
        if (!referralDoc.exists) {
            throw new ApiError('Referral not found', 404);
        }

        const referralData = referralDoc.data();

        // Verify creator
        if (referralData?.createdBy !== uid) {
            throw new ApiError('Only the referral creator can close it', 403);
        }

        // Update status
        await db.collection('referrals').doc(referralId).update({
            status: 'closed',
            closedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Referral closed',
            referralId
        });
    } catch (error) {
        next(error);
    }
});

export default router;
