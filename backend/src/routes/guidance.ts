import express, { Router, Response, NextFunction } from 'express';
import { verifyFirebaseToken, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

const router: Router = express.Router();

// ✅ Request Guidance (POST /api/guidance/request)
router.post('/request', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { topic, description, tenantId } = req.body;
        const uid = req.user?.uid;

        const docRef = await db.collection('guidance_requests').add({
            requestedBy: uid,
            topic,
            description,
            status: 'pending',
            createdAt: new Date(),
            tenantId: tenantId || 'default'
        });

        res.json({ id: docRef.id, message: 'Guidance request created' });
    } catch (error) {
        next(error);
    }
});

// ✅ Get Filtered Requests (GET /api/guidance/filtered)
router.get('/filtered', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const snapshot = await db.collection('guidance_requests')
            .where('status', '==', 'pending')
            .limit(50)
            .get();

        const requests = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        res.json(requests);
    } catch (error) {
        next(error);
    }
});

// ✅ Reply to Guidance (POST /api/guidance/:requestId/reply)
router.post('/:requestId/reply', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { requestId } = req.params;
        const { reply } = req.body;
        const uid = req.user?.uid;

        await db.collection('guidance_requests').doc(requestId).update({
            reply,
            repliedBy: uid,
            repliedAt: new Date(),
            status: 'replied'
        });

        res.json({ message: 'Reply added successfully' });
    } catch (error) {
        next(error);
    }
});

// ✅ Accept Guidance Request (POST /api/guidance/:requestId/accept)
router.post('/:requestId/accept', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { requestId } = req.params;
        const uid = req.user?.uid;

        await db.collection('guidance_requests').doc(requestId).update({
            acceptedBy: uid,
            status: 'accepted',
            acceptedAt: new Date()
        });

        res.json({ message: 'Guidance request accepted' });
    } catch (error) {
        next(error);
    }
});

export default router;
