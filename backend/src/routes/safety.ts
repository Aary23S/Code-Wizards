import express, { Router, Response, NextFunction } from 'express';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { isWhitelistedAdmin } from '../config/adminWhitelist.js';

const router: Router = express.Router();

// ✅ Report Student (POST /api/safety/report)
router.post('/report', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { studentId, reason, requestId, tenantId } = req.body;
        const reportedBy = req.user?.uid;

        const docRef = await db.collection('safety_reports').add({
            reportedStudent: studentId,
            reportedBy,
            reason,
            relatedGuidanceRequest: requestId || null,
            status: 'pending',
            createdAt: new Date(),
            tenantId: tenantId || 'default'
        });

        res.json({ id: docRef.id, message: 'Safety report submitted' });
    } catch (error) {
        next(error);
    }
});

// ✅ Get Safety Reports (for admin) (GET /api/safety/reports)
router.get('/reports', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const adminEmail = req.user?.email;

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        const snapshot = await db.collection('safety_reports')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const reports = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        res.json(reports);
    } catch (error) {
        next(error);
    }
});

// ✅ Resolve Safety Report (POST /api/safety/:reportId/resolve)
router.post('/:reportId/resolve', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { reportId } = req.params;
        const { resolution, action } = req.body;
        const adminEmail = req.user?.email;

        // Verify admin
        if (!isWhitelistedAdmin(adminEmail || '')) {
            return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        // Get report details
        const reportDoc = await db.collection('safety_reports').doc(reportId).get();
        if (!reportDoc.exists) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const reportData = reportDoc.data() as any;

        // Update report status
        await db.collection('safety_reports').doc(reportId).update({
            status: 'resolved',
            resolution: resolution || 'No details provided',
            resolvedAt: new Date(),
            resolvedBy: adminEmail,
            adminAction: action || 'none'
        });

        // If action is suspend, suspend the reported user
        if (action === 'suspend' && reportData.reportedStudent) {
            const suspensionEnd = new Date();
            suspensionEnd.setDate(suspensionEnd.getDate() + 30);

            await db.collection('users').doc(reportData.reportedStudent).update({
                status: 'suspended',
                suspendedAt: new Date(),
                suspensionEnd: suspensionEnd,
                suspensionReason: `Safety report: ${reportData.reason}`,
                suspendedBy: adminEmail
            });
        }

        // Log admin action
        await db.collection('admin_audit_logs').add({
            timestamp: new Date(),
            adminEmail,
            action: 'resolve_safety_report',
            targetUserId: reportData.reportedStudent,
            reportId,
            resolution,
            adminAction: action || 'none',
            ipAddress: req.ip || 'unknown'
        });

        res.json({ message: 'Safety report resolved successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
