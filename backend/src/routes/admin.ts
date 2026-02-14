import { Router } from 'express';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';

const router: Router = Router();

// ✅ Admin Dashboard (GET /api/admin/dashboard)
router.get('/dashboard', verifyFirebaseToken, async (req: AuthRequest, res, next) => {
    try {
        res.json({ message: 'Admin dashboard route created - logic coming soon' });
    } catch (error) {
        next(error);
    }
});

export default router;
