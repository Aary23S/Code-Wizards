import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';

declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email: string;
            };
        }
    }
}

export type AuthRequest = Request;

export const verifyFirebaseToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
        };
        
        next();
    } catch (error: any) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid authorization token' });
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (token) {
            const decodedToken = await auth.verifyIdToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email || '',
            };
        }
        
        next();
    } catch (error) {
        // Optional auth - continue without user
        next();
    }
};
