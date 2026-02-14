import express, { Router, Response, NextFunction } from 'express';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

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

export default router;
