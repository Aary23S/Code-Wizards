import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { assertRole } from "../common/authGuard";
import { logAdminAction } from "../common/auditLogger";
import {
    approveAlumniSchema,
    suspendUserSchema,
    createAnnouncementSchema,
    resolveSafetyReportSchema,
    promoteToAdminSchema,
    searchUsersSchema
} from "../common/validators";

const db = admin.firestore();
const auth = admin.auth();

export const approveAlumni = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // 1. Guard: Admin Only
    assertRole(context, ["admin"]);

    // 2. Validate Input
    const parsed = approveAlumniSchema.parse(data);
    const targetUid = parsed.uid;

    // 3. Business Logic: Activate User
    const userRef = db.collection("users").doc(targetUid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
    }

    if (userSnap.data()?.role !== "alumni") {
        throw new functions.https.HttpsError("failed-precondition", "Target is not an alumni.");
    }

    // 4. Update Claims & Firestore
    await auth.setCustomUserClaims(targetUid, { role: "alumni", status: "active" });
    await userRef.update({ status: "active" });

    // 5. Audit Log
    await logAdminAction(
        context.auth!.uid,
        "approve_alumni",
        targetUid,
        { tenantId: parsed.tenantId }
    );

    return { success: true };
});

export const suspendUser = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertRole(context, ["admin"]);

    // 1. Validate Input
    const { uid, reason } = suspendUserSchema.parse(data);

    // 1. Disable in Auth (Revokes access tokens roughly within 1 hour, refreshing fails immediately)
    await auth.updateUser(uid, { disabled: true });

    // 2. Revoke Refresh Tokens (Force logout)
    await auth.revokeRefreshTokens(uid);

    // 3. Update Firestore
    await db.collection("users").doc(uid).update({
        status: "suspended",
        suspensionReason: reason,
        suspendedAt: FieldValue.serverTimestamp()
    });

    // 4. Audit
    await logAdminAction(context.auth!.uid, "suspend_user", uid, { reason });

    return { success: true, message: "User suspended." };
});

export const getAdminDashboardStats = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertRole(context, ["admin"]);

    try {
        // 1. Fetch Pending Alumni
        const pendingAlumniSnap = await db.collection("users")
            .where("role", "==", "alumni")
            .where("status", "==", "pending")
            .limit(20)
            .get();

        const pendingAlumni = pendingAlumniSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 2. Fetch Pending Safety Reports
        const pendingReportsSnap = await db.collection("safetyReports")
            .where("status", "==", "pending")
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        const pendingReports = pendingReportsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 3. Fetch Recent Audit Logs
        const recentLogsSnap = await db.collection("auditLogs")
            .orderBy("timestamp", "desc")
            .limit(50)
            .get();

        const recentLogs = recentLogsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 4. Fetch Recent Announcements
        const announcementsSnap = await db.collection("announcements")
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        const announcements = announcementsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            pendingAlumni,
            pendingReports,
            recentLogs,
            announcements
        };
    } catch (error: any) {
        console.error("getAdminDashboardStats error:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch admin stats.");
    }
});

export const createAnnouncement = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertRole(context, ["admin"]);

    const result = createAnnouncementSchema.safeParse(data);
    if (!result.success) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data.", result.error.format());
    }
    const { title, content, type, tenantId } = result.data;

    const announcementRef = db.collection("announcements").doc();
    await announcementRef.set({
        title,
        content,
        type,
        tenantId,
        authorId: context.auth!.uid,
        createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, announcementId: announcementRef.id };
});

export const resolveSafetyReport = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertRole(context, ["admin"]);

    const result = resolveSafetyReportSchema.safeParse(data);
    if (!result.success) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data.", result.error.format());
    }
    const { reportId, resolution, action, tenantId } = result.data;

    const reportRef = db.collection("safetyReports").doc(reportId);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Report not found.");
    }

    const reportData = reportSnap.data()!;

    // 1. Resolve Report
    await reportRef.update({
        status: "resolved",
        resolution,
        resolvedBy: context.auth!.uid,
        resolvedAt: FieldValue.serverTimestamp(),
    });

    // 2. Take Action if needed (Manual for now, but we check flag)
    if (action === "suspend") {
        await auth.updateUser(reportData.studentId, { disabled: true });
        await auth.revokeRefreshTokens(reportData.studentId);
        await db.collection("users").doc(reportData.studentId).update({
            status: "suspended",
            suspensionReason: `Safety Report Resolution: ${resolution}`,
            suspendedAt: FieldValue.serverTimestamp()
        });
    }

    // 3. Audit Log
    await db.collection("auditLogs").add({
        action: "REPORT_RESOLVED",
        actorId: context.auth!.uid,
        targetId: reportId,
        metadata: { action, resolutionSummary: resolution.substring(0, 50) },
        timestamp: FieldValue.serverTimestamp(),
        tenantId,
    });

    return { success: true };
});

export const promoteToAdmin = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertRole(context, ["admin"]);

    const result = promoteToAdminSchema.safeParse(data);
    if (!result.success) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data.", result.error.format());
    }
    const { uid, tenantId } = result.data;

    // 1. Update Auth Claims
    await auth.setCustomUserClaims(uid, { role: "admin" });

    // 2. Update Firestore
    await db.collection("users").doc(uid).update({
        role: "admin",
        updatedAt: FieldValue.serverTimestamp()
    });

    // 3. Audit Log
    await db.collection("auditLogs").add({
        action: "USER_PROMOTED_TO_ADMIN",
        actorId: context.auth!.uid,
        targetId: uid,
        timestamp: FieldValue.serverTimestamp(),
        tenantId,
    });

    return { success: true };
});

export const searchUsers = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertRole(context, ["admin"]);

    const result = searchUsersSchema.safeParse(data);
    if (!result.success) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data.", result.error.format());
    }
    const { query } = result.data;

    try {
        const usersSnap = await db.collection("users")
            .where("email", ">=", query)
            .where("email", "<=", query + "\uf8ff")
            .limit(10)
            .get();

        const users = usersSnap.docs.map(doc => ({
            uid: doc.id,
            displayName: doc.data().displayName,
            email: doc.data().email,
            role: doc.data().role,
            status: doc.data().status
        }));

        return { users };
    } catch (error: any) {
        console.error("searchUsers error:", error);
        throw new functions.https.HttpsError("internal", "Failed to search users.");
    }
});

