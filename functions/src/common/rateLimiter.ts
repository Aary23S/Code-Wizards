import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Checks if a user has exceeded the rate limit for a specific action.
 * Uses a subcollection 'rateLimits' on the user document or a global collection.
 * For MVP, we check a timestamp on the user's private activity log.
 * 
 * @param {string} uid - The user ID.
 * @param {string} actionType - The type of action (e.g., 'guidance_request').
 * @param {number} limitDurationSeconds - The cooldown period in seconds.
 * @throws {functions.https.HttpsError} If rate limit exceeded.
 */
export const checkRateLimit = async (
    uid: string,
    actionType: string,
    limitDurationSeconds: number
): Promise<void> => {
    const db = admin.firestore();
    const limitRef = db.collection("users").doc(uid).collection("rateLimits").doc(actionType);

    const snapshot = await limitRef.get();

    if (snapshot.exists) {
        const lastAction = snapshot.data()?.lastActionTime as admin.firestore.Timestamp;
        if (lastAction) {
            const now = admin.firestore.Timestamp.now();
            const diffSeconds = now.seconds - lastAction.seconds;

            if (diffSeconds < limitDurationSeconds) {
                throw new functions.https.HttpsError(
                    "resource-exhausted",
                    `Rate limit exceeded. Please wait ${limitDurationSeconds - diffSeconds} seconds.`
                );
            }
        }
    }

    // Note: The caller is responsible for updating the timestamp AFTER the action succeeds.
    // We provide a helper for that too.
};

export const updateRateLimit = async (
    uid: string,
    actionType: string
): Promise<void> => {
    const db = admin.firestore();
    await db.collection("users").doc(uid).collection("rateLimits").doc(actionType).set({
        lastActionTime: FieldValue.serverTimestamp(),
    });
};
