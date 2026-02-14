import { Router, Response, NextFunction } from 'express';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';

const router: Router = Router();

// ✅ Create Post (POST /api/posts)
router.post('/', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        res.json({ message: 'POST route created - logic coming soon' });
    } catch (error) {
        next(error);
    }
});

// ✅ Get Posts (GET /api/posts)
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        res.json({ message: 'GET posts route created - logic coming soon' });
    } catch (error) {
        next(error);
    }
});

export default router;
