import { Router } from 'express';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';

const router: Router = Router();

// ✅ Report Student (POST /api/safety/report)
router.post('/report', verifyFirebaseToken, async (req: AuthRequest, res, next) => {
    try {
        res.json({ message: 'Safety report route created - logic coming soon' });
    } catch (error) {
        next(error);
    }
});

export default router;
