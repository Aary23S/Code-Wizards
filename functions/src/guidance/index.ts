import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { assertRole } from "../common/authGuard";
import { requestGuidanceSchema, replyGuidanceSchema } from "../common/validators";
import { checkRateLimit, updateRateLimit } from "../common/rateLimiter";

const db = admin.firestore();

export const requestGuidance = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
        // 1. Logic: Only students can request
        assertRole(context, ["student"]);
        const uid = context.auth!.uid;

        // 2. Validate
        const result = requestGuidanceSchema.safeParse(data);
        if (!result.success) {
            console.error("Guidance validation failed:", result.error.format());
            throw new functions.https.HttpsError("invalid-argument", "Invalid guidance request.", result.error.format());
        }
        const parsed = result.data;

        // 3. Specific Logic: Referrals have a 30-day cooldown
        if (parsed.type === "referral") {
            await checkRateLimit(uid, "request_referral", 30 * 24 * 60 * 60); // 30 days
        } else {
            await checkRateLimit(uid, "request_guidance", 300); // 5 minutes
        }

        // 4. Create Request
        const requestRef = db.collection("guidanceRequests").doc();
        await requestRef.set({
            ...parsed,
            studentId: uid,
            status: "pending",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        if (parsed.type === "referral") {
            await updateRateLimit(uid, "request_referral");
        } else {
            await updateRateLimit(uid, "request_guidance");
        }
        return { success: true, requestId: requestRef.id };
    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("RequestGuidance internal error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to request guidance.");
    }
});

export const replyToGuidance = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
        // 1. Logic: Alumni or Admin can reply
        assertRole(context, ["alumni", "admin"]);
        const responderId = context.auth!.uid;

        // 2. Validate
        const result = replyGuidanceSchema.safeParse(data);
        if (!result.success) {
            console.error("Reply validation failed:", result.error.format());
            throw new functions.https.HttpsError("invalid-argument", "Invalid reply data.", result.error.format());
        }
        const parsed = result.data;
        const { requestId, response, status } = parsed;

        const requestRef = db.collection("guidanceRequests").doc(requestId);
        const doc = await requestRef.get();

        if (!doc.exists) {
            throw new functions.https.HttpsError("not-found", "Guidance request not found.");
        }

        const requestData = doc.data();
        if (requestData?.mentorId !== responderId && context.auth!.token.role !== "admin") {
            throw new functions.https.HttpsError("permission-denied", "You are not the targeted mentor.");
        }

        // 3. Update Request
        await requestRef.update({
            response,
            responderId,
            status: status || "completed",
            respondedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true };
    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("ReplyGuidance internal error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to reply to guidance.");
    }
});
