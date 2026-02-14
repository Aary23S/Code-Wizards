import { Router, Response, NextFunction } from 'express';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';

const router: Router = Router();

// ✅ Get Alumni Stats (GET /api/alumni/stats)
router.get('/stats', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        res.json({ message: 'Alumni stats route created - logic coming soon' });
    } catch (error) {
        next(error);
    }
});

export default router;
