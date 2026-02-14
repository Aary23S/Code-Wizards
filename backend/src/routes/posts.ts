import express, { Router, Response, NextFunction } from 'express';
import { verifyFirebaseToken, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

const router: Router = express.Router();

// ✅ Create Post (POST /api/posts)
router.post('/', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, content, tags, tenantId } = req.body;
        const uid = req.user?.uid;

        const docRef = await db.collection('posts').add({
            title,
            content,
            tags: tags || [],
            createdBy: uid,
            likes: 0,
            comments: 0,
            createdAt: new Date(),
            tenantId: tenantId || 'default'
        });

        res.json({ id: docRef.id, message: 'Post created successfully' });
    } catch (error) {
        next(error);
    }
});

// ✅ Get Posts (GET /api/posts)
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const snapshot = await db.collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const posts = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        res.json(posts);
    } catch (error) {
        next(error);
    }
});

// ✅ Like Post (POST /api/posts/:postId/like)
router.post('/:postId/like', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { postId } = req.params;
        const uid = req.user?.uid;

        const postRef = db.collection('posts').doc(postId);
        await db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) throw new Error('Post not found');

            const likedBy = postDoc.data()?.likedBy || [];
            if (!likedBy.includes(uid)) {
                transaction.update(postRef, {
                    likes: (postDoc.data()?.likes || 0) + 1,
                    likedBy: [...likedBy, uid]
                });
            }
        });

        res.json({ message: 'Post liked' });
    } catch (error) {
        next(error);
    }
});

// ✅ Comment on Post (POST /api/posts/:postId/comment)
router.post('/:postId/comment', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const uid = req.user?.uid;

        const postRef = db.collection('posts').doc(postId);
        await db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) throw new Error('Post not found');

            const comments = postDoc.data()?.comments || [];
            transaction.update(postRef, {
                comments: comments.length + 1,
                commentsList: [...comments, { content, by: uid, at: new Date() }]
            });
        });

        res.json({ message: 'Comment added' });
    } catch (error) {
        next(error);
    }
});

// ✅ Delete Post (DELETE /api/posts/:postId)
router.delete('/:postId', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { postId } = req.params;
        const uid = req.user?.uid;

        const postDoc = await db.collection('posts').doc(postId).get();
        if (!postDoc.exists) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (postDoc.data()?.createdBy !== uid) {
            return res.status(403).json({ error: 'You can only delete your own posts' });
        }

        await db.collection('posts').doc(postId).delete();
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
