import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { assertAuth } from "../common/authGuard";
import { createPostSchema, updatePostSchema } from "../common/validators";
import { checkRateLimit, updateRateLimit } from "../common/rateLimiter";

const db = admin.firestore();

export const createPost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
        assertAuth(context);
        const uid = context.auth!.uid;

        await checkRateLimit(uid, "create_post", 60); // 1 post per minute

        const result = createPostSchema.safeParse(data);
        if (!result.success) {
            console.error("Post validation failed:", result.error.format());
            throw new functions.https.HttpsError("invalid-argument", "Invalid post data.", result.error.format());
        }
        const parsed = result.data;

        const postRef = db.collection("posts").doc();
        await postRef.set({
            ...parsed,
            authorId: uid,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            likes: 0,
            commentsCount: 0,
        });

        await updateRateLimit(uid, "create_post");
        return { success: true, postId: postRef.id };
    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("CreatePost internal error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to create post.");
    }
});

export const getPosts = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // Publicly accessible, or restrict if needed.
    // For now, let's allow public read, but we can check context if we want to personalize.

    const { limit = 10, startAfter } = data;
    const limitNum = Math.min(Math.max(Number(limit), 1), 50); // Clamp between 1 and 50

    let query = db.collection("posts")
        .orderBy("createdAt", "desc")
        .limit(limitNum);

    if (startAfter) {
        const startAfterDoc = await db.collection("posts").doc(startAfter).get();
        if (startAfterDoc.exists) {
            query = query.startAfter(startAfterDoc);
        }
    }

    const snapshot = await query.get();

    // Fetch author profiles for all posts
    const posts = await Promise.all(snapshot.docs.map(async (doc) => {
        const postData = doc.data();
        let authorName = "Anonymous Wizard";

        try {
            const profileDoc = await db.collection("profiles").doc(postData.authorId).get();
            if (profileDoc.exists) {
                authorName = profileDoc.data()?.displayName || authorName;
            }
        } catch (error) {
            console.error("Error fetching author profile:", error);
        }

        return {
            id: doc.id,
            ...postData,
            authorName
        };
    }));

    return { posts };
});

export const deletePost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertAuth(context);
    const uid = context.auth!.uid;
    const { postId } = data;

    if (!postId) {
        throw new functions.https.HttpsError("invalid-argument", "postId is required");
    }

    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();

    if (!doc.exists) {
        throw new functions.https.HttpsError("not-found", "Post not found");
    }

    const postData = doc.data();

    // Check ownership or admin
    if (postData?.authorId !== uid && context.auth!.token.role !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "You can only delete your own posts.");
    }

    await postRef.delete();

    return { success: true };
});

export const updatePost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertAuth(context);
    const uid = context.auth!.uid;

    const parsed = updatePostSchema.parse(data);
    const { postId, ...updates } = parsed;

    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();

    if (!doc.exists) {
        throw new functions.https.HttpsError("not-found", "Post not found");
    }

    if (doc.data()?.authorId !== uid) {
        throw new functions.https.HttpsError("permission-denied", "You can only edit your own posts.");
    }

    await postRef.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
});

export const likePost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertAuth(context);
    const uid = context.auth!.uid;

    const { postId } = data;
    if (!postId) {
        throw new functions.https.HttpsError("invalid-argument", "postId is required");
    }

    const postRef = db.collection("posts").doc(postId);
    const likeRef = db.collection("posts").doc(postId).collection("likes").doc(uid);

    try {
        await db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            const likeDoc = await transaction.get(likeRef);

            if (!postDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Post not found");
            }

            if (likeDoc.exists) {
                // Unlike
                transaction.delete(likeRef);
                transaction.update(postRef, {
                    likes: FieldValue.increment(-1)
                });
            } else {
                // Like
                transaction.set(likeRef, {
                    userId: uid,
                    createdAt: FieldValue.serverTimestamp()
                });
                transaction.update(postRef, {
                    likes: FieldValue.increment(1)
                });
            }
        });

        return { success: true };
    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("likePost error:", error);
        throw new functions.https.HttpsError("internal", "Failed to like post");
    }
});

export const commentPost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertAuth(context);
    const uid = context.auth!.uid;

    const { postId, content } = data;
    if (!postId || !content) {
        throw new functions.https.HttpsError("invalid-argument", "postId and content are required");
    }

    const postRef = db.collection("posts").doc(postId);
    const commentsRef = postRef.collection("comments");

    try {
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Post not found");
        }

        const commentRef = commentsRef.doc();
        await db.runTransaction(async (transaction) => {
            transaction.set(commentRef, {
                userId: uid,
                content,
                createdAt: FieldValue.serverTimestamp()
            });
            transaction.update(postRef, {
                commentsCount: FieldValue.increment(1)
            });
        });

        return { success: true, commentId: commentRef.id };
    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("commentPost error:", error);
        throw new functions.https.HttpsError("internal", "Failed to comment on post");
    }
});
