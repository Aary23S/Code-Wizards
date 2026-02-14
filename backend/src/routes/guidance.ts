import { Router, Response, NextFunction } from 'express';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';

const router: Router = Router();

// ✅ Request Guidance (POST /api/guidance/request)
router.post('/request', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        res.json({ message: 'Guidance request route created - logic coming soon' });
    } catch (error) {
        next(error);
    }
});

export default router;
