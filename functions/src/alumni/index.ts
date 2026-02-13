import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { assertRole } from "../common/authGuard";

const db = admin.firestore();

export const getAlumniStats = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // 1. Guard: Alumni or Admin Only
    assertRole(context, ["alumni", "admin"]);
    const uid = context.auth!.uid;

    try {
        // 2. Fetch Core Data (User Info & Alumni Meta)
        const userDoc = await db.collection("users").doc(uid).get();
        const metaDoc = await db.collection("alumniMeta").doc(uid).get();

        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User not found.");
        }

        const userData = userDoc.data() || {};
        const metaData = metaDoc.data() || {};

        // 3. Aggregate Engagement Metrics

        // Count Community Posts
        const postsSnap = await db.collection("posts").where("authorId", "==", uid).count().get();
        const postsCount = postsSnap.data().count;

        // Count Guidance Activity
        // Note: Guidance system uses requester/mentor model
        // - Active engagements: where mentorId == uid and status == 'accepted'
        // - Closed requests: where mentorId == uid and status == 'completed'
        // - Total responses: where responderId == uid (across any request)

        const activeEngagementsSnap = await db.collection("guidanceRequests")
            .where("mentorId", "==", uid)
            .where("status", "==", "accepted")
            .count().get();

        const closedRequestsSnap = await db.collection("guidanceRequests")
            .where("mentorId", "==", uid)
            .where("status", "==", "completed")
            .count().get();

        const totalResponsesSnap = await db.collection("guidanceRequests")
            .where("mentorId", "==", uid)
            .count().get();

        // Count Pending Requests (General Open Requests matching expertise or specifically assigned)
        const pendingAssignedSnap = await db.collection("guidanceRequests")
            .where("mentorId", "==", uid)
            .where("status", "==", "pending")
            .count().get();

        // 4. Notification / Announcements
        const adminAnnouncementsSnap = await db.collection("announcements")
            .limit(5)
            .get();

        const announcements = adminAnnouncementsSnap.docs
            .sort((a, b) => {
                const aTime = a.data().createdAt?._seconds || 0;
                const bTime = b.data().createdAt?._seconds || 0;
                return bTime - aTime;
            })
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        return {
            status: userData.status || "pending",
            mentorOptIn: metaData.mentorOptIn ?? false,
            referralOptIn: metaData.referralOptIn ?? false,
            metrics: {
                postsCount,
                activeEngagements: activeEngagementsSnap.data().count,
                closedRequests: closedRequestsSnap.data().count,
                totalResponses: totalResponsesSnap.data().count,
                pendingRequests: pendingAssignedSnap.data().count
            },
            announcements
        };

    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("getAlumniStats error details:", {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        throw new functions.https.HttpsError("internal", `getAlumniStats failed: ${error.message}`);
    }
});

export const getFilteredRequests = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertRole(context, ["alumni", "admin"]);
    const uid = context.auth!.uid;

    try {
        const metaDoc = await db.collection("alumniMeta").doc(uid).get();
        const expertise = metaDoc.data()?.expertise || [];

        // 1. Fetch assigned requests
        const assignedSnap = await db.collection("guidanceRequests")
            .where("mentorId", "==", uid)
            .where("status", "in", ["pending", "accepted"])
            .get();

        // 2. Fetch open requests (no mentorId or mentorId == 'general')
        // Firestore doesn't support easy keyword matching across fields efficiently,
        // so we'll fetch open pending requests and do a simple match if needed,
        // or just return all and let frontend highlight.
        const openSnap = await db.collection("guidanceRequests")
            .where("status", "==", "pending")
            .get();

        const allRequests = [
            ...assignedSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "assigned" })),
            ...openSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "open" }))
        ];

        // Deduplicate and filter (if assignedSnap also caught some)
        const uniqueRequests = Array.from(new Map(allRequests.map(item => [item.id, item])).values());

        // Match expertise keywords against topic/message
        const result = uniqueRequests.map((req: any) => {
            let expertiseMatch = false;

            // If it's an open request, check for expertise match
            if (req.type === "open" && expertise.length > 0) {
                const searchStr = `${req.topic} ${req.message}`.toLowerCase();
                expertiseMatch = expertise.some((exp: string) => searchStr.includes(exp.toLowerCase()));
            }

            return { ...req, expertiseMatch };
        }).filter((req: any) => {
            // Already assigned to someone else
            if (req.type === "open" && req.mentorId && req.mentorId !== uid) return false;

            // If it's an open request, only return if it matches expertise OR is Broad (no mentorId)
            if (req.type === "open") {
                return req.expertiseMatch || !req.mentorId;
            }

            return true;
        });

        return result;
    } catch (error: any) {
        throw new functions.https.HttpsError("internal", error.message);
    }
});

export const acceptGuidanceRequest = functions.https.onCall(async (data: { requestId: string }, context: functions.https.CallableContext) => {
    assertRole(context, ["alumni"]);
    const uid = context.auth!.uid;

    const requestRef = db.collection("guidanceRequests").doc(data.requestId);
    const doc = await requestRef.get();

    if (!doc.exists) throw new functions.https.HttpsError("not-found", "Request not found.");

    const requestData = doc.data();
    if (requestData?.status !== "pending") {
        throw new functions.https.HttpsError("failed-precondition", "Request is no longer pending.");
    }

    await requestRef.update({
        mentorId: uid,
        status: "accepted",
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });

    return { success: true };
});
