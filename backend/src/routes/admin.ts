import express, { Router, Response, NextFunction } from 'express';
import { db, auth } from '../config/firebase.js';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';
import { isWhitelistedAdmin } from '../config/adminWhitelist.js';

const router: Router = express.Router();

// ✅ Get Admin Dashboard (GET /api/admin/dashboard)
router.get('/dashboard', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const email = req.user?.email;

        // Check if user is admin
        if (!isWhitelistedAdmin(email || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        // Get stats
        const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
        const alumniSnapshot = await db.collection('users').where('role', '==', 'alumni').get();
        const pendingAlumniSnapshot = await db.collection('users')
            .where('role', '==', 'alumni')
            .where('approved', '==', false)
            .get();

        res.json({
            totalStudents: studentsSnapshot.size,
            totalAlumni: alumniSnapshot.size,
            pendingAlumniApprovals: pendingAlumniSnapshot.size,
            lastUpdated: new Date()
        });
    } catch (error) {
        next(error);
    }
});

// ✅ Approve Alumni (POST /api/admin/approve-alumni)
router.post('/approve-alumni', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { uid } = req.body;
        const adminEmail = req.user?.email;

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        // Update user approval status
        await db.collection('users').doc(uid).update({
            approved: true,
            approvedAt: new Date(),
            approvedBy: adminEmail
        });

        // Set custom claim
        await auth.setCustomUserClaims(uid, { role: 'alumni', approved: true });

        res.json({ message: 'Alumni approved successfully' });
    } catch (error) {
        next(error);
    }
});

// ✅ Create Announcement (POST /api/admin/announcement)
router.post('/announcement', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, content } = req.body;
        const adminEmail = req.user?.email;

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        const docRef = await db.collection('announcements').add({
            title,
            content,
            createdBy: adminEmail,
            createdAt: new Date()
        });

        res.json({ id: docRef.id, message: 'Announcement created successfully' });
    } catch (error) {
        next(error);
    }
});

// ✅ Get Pending Alumni (GET /api/admin/pending-alumni)
router.get('/pending-alumni', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const adminEmail = req.user?.email;

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        // Get pending alumni
        const snapshot = await db.collection('users')
            .where('role', '==', 'alumni')
            .where('approved', '==', false)
            .orderBy('createdAt', 'desc')
            .get();

        const pendingAlumni = snapshot.docs.map((doc: any) => ({
            uid: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        res.json(pendingAlumni);
    } catch (error) {
        next(error);
    }
});

// ✅ Reject Alumni (POST /api/admin/reject-alumni)
router.post('/reject-alumni', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { uid, reason } = req.body;
        const adminEmail = req.user?.email;

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        // Update rejection status
        await db.collection('users').doc(uid).update({
            approved: false,
            rejected: true,
            rejectionReason: reason || 'No reason provided',
            rejectedAt: new Date(),
            rejectedBy: adminEmail
        });

        res.json({ message: 'Alumni rejected successfully' });
    } catch (error) {
        next(error);
    }
});

// ✅ Suspend User (POST /api/admin/suspend-user)
router.post('/suspend-user', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { uid, reason } = req.body;
        const adminEmail = req.user?.email;

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        // Prevent self-suspension
        if (req.user?.uid === uid) {
            return res.status(400).json({ error: 'Cannot suspend yourself' });
        }

        // Set suspension (30 days default)
        const suspensionEnd = new Date();
        suspensionEnd.setDate(suspensionEnd.getDate() + 30);

        await db.collection('users').doc(uid).update({
            status: 'suspended',
            suspendedAt: new Date(),
            suspensionEnd: suspensionEnd,
            suspensionReason: reason || 'Platform terms violation',
            suspendedBy: adminEmail
        });

        // Log admin action
        await db.collection('admin_audit_logs').add({
            timestamp: new Date(),
            adminEmail,
            action: 'suspend_user',
            targetUserId: uid,
            reason,
            ipAddress: req.ip || 'unknown'
        });

        res.json({ message: 'User suspended for 30 days' });
    } catch (error) {
        next(error);
    }
});

// ✅ Block User (Permanently) (POST /api/admin/block-user)
router.post('/block-user', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { uid, reason } = req.body;
        const adminEmail = req.user?.email;

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        // Prevent self-blocking
        if (req.user?.uid === uid) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }

        // Block user permanently
        await db.collection('users').doc(uid).update({
            status: 'blocked',
            blockedAt: new Date(),
            blockReason: reason || 'Serious platform violation',
            blockedBy: adminEmail
        });

        // Log admin action
        await db.collection('admin_audit_logs').add({
            timestamp: new Date(),
            adminEmail,
            action: 'block_user',
            targetUserId: uid,
            reason,
            ipAddress: req.ip || 'unknown'
        });

        res.json({ message: 'User blocked permanently' });
    } catch (error) {
        next(error);
    }
});

// ✅ Search Users (GET /api/admin/search-users)
router.get('/search-users', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const adminEmail = req.user?.email;
        const query = (req.query.q as string || '').toLowerCase();

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        // Search by email or display name
        const snapshot = await db.collection('users').limit(20).get();
        
        const results = snapshot.docs
            .map((doc: any) => ({
                uid: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            }))
            .filter((user: any) => 
                (user.email && user.email.toLowerCase().includes(query)) ||
                (user.displayName && user.displayName.toLowerCase().includes(query))
            );

        res.json(results);
    } catch (error) {
        next(error);
    }
});

// ✅ Get Audit Logs (GET /api/admin/audit-logs)
router.get('/audit-logs', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const adminEmail = req.user?.email;

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        // Get recent audit logs (last 100)
        const snapshot = await db.collection('admin_audit_logs')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        const logs = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
        }));

        res.json(logs);
    } catch (error) {
        next(error);
    }
});

export default router;
