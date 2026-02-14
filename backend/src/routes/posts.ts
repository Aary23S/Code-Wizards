import express, { Router, Response, NextFunction } from 'express';
import { verifyFirebaseToken, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

const router: Router = express.Router();

// ✅ Create Post (POST /api/posts)
// Safety: User must not be suspended or blocked
router.post('/', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title, content, tags, tenantId } = req.body;
        const uid = req.user?.uid;

        if (!title || !content) {
            return res.status(400).json({ error: 'title and content are required' });
        }

        // Check user status - must not be suspended or blocked
        const userDoc = await db.collection('users').doc(uid!).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        if (userData?.status === 'suspended') {
            return res.status(403).json({ error: 'Cannot post while suspended' });
        }
        if (userData?.status === 'blocked') {
            return res.status(403).json({ error: 'Cannot post while blocked' });
        }

        // Create post
        const docRef = await db.collection('posts').add({
            title,
            content,
            tags: tags || [],
            createdBy: uid,
            authorRole: userData?.role,
            likes: 0,
            likedBy: [],
            comments: 0,
            commentsList: [],
            status: 'published',
            createdAt: new Date(),
            tenantId: tenantId || 'default'
        });

        // Log activity
        await db.collection('users').doc(uid!).collection('activity').add({
            type: 'post_created',
            postId: docRef.id,
            title,
            timestamp: new Date(),
            details: {
                postId: docRef.id,
                title,
                contentLength: content.length
            }
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
// Safety: User must not be suspended or blocked
router.post('/:postId/like', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { postId } = req.params;
        const uid = req.user?.uid;

        // Check user status
        const userDoc = await db.collection('users').doc(uid!).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        if (userData?.status === 'suspended') {
            return res.status(403).json({ error: 'Cannot interact with posts while suspended' });
        }
        if (userData?.status === 'blocked') {
            return res.status(403).json({ error: 'Cannot interact with posts while blocked' });
        }

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

                // Log activity
                const userRef = db.collection('users').doc(uid!);
                const activityRef = userRef.collection('activity').doc();
                transaction.set(activityRef, {
                    type: 'post_liked',
                    postId,
                    postTitle: postDoc.data()?.title,
                    timestamp: new Date(),
                    details: {
                        postId,
                        byAuthor: postDoc.data()?.createdBy
                    }
                });
            }
        });

        res.json({ message: 'Post liked' });
    } catch (error) {
        next(error);
    }
});

// ✅ Comment on Post (POST /api/posts/:postId/comment)
// Safety: User must not be suspended or blocked
router.post('/:postId/comment', verifyFirebaseToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const uid = req.user?.uid;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        // Check user status
        const userDoc = await db.collection('users').doc(uid!).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        if (userData?.status === 'suspended') {
            return res.status(403).json({ error: 'Cannot comment while suspended' });
        }
        if (userData?.status === 'blocked') {
            return res.status(403).json({ error: 'Cannot comment while blocked' });
        }

        const postRef = db.collection('posts').doc(postId);
        await db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) throw new Error('Post not found');

            const commentsList = postDoc.data()?.commentsList || [];
            const newComment = {
                id: db.collection('temp').doc().id, // Generate unique comment ID
                content,
                by: uid,
                at: new Date()
            };

            transaction.update(postRef, {
                comments: commentsList.length + 1,
                commentsList: [...commentsList, newComment]
            });

            // Log activity
            const userRef = db.collection('users').doc(uid!);
            const activityRef = userRef.collection('activity').doc();
            transaction.set(activityRef, {
                type: 'post_commented',
                postId,
                postTitle: postDoc.data()?.title,
                content,
                timestamp: new Date(),
                details: {
                    postId,
                    contentLength: content.length,
                    byAuthor: postDoc.data()?.createdBy
                }
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
