import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { assertRole } from "../common/authGuard";
import { reportStudentSchema } from "../common/validators";

const db = admin.firestore();

export const reportStudent = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
        // Only Alumni or Admins can report students
        assertRole(context, ["alumni", "admin"]);
        const reporterId = context.auth!.uid;

        // Validate
        const result = reportStudentSchema.safeParse(data);
        if (!result.success) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid report data.", result.error.format());
        }
        const { studentId, reason, requestId, tenantId } = result.data;

        // Verify student exists
        const studentDoc = await db.collection("users").doc(studentId).get();
        if (!studentDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Student not found.");
        }

        // 1. Create Report
        const reportRef = db.collection("safetyReports").doc();
        await reportRef.set({
            reporterId,
            studentId,
            reason,
            requestId: requestId || null,
            status: "pending",
            tenantId,
            createdAt: FieldValue.serverTimestamp(),
        });

        // 2. Audit Log
        await db.collection("auditLogs").add({
            action: "STUDENT_REPORTED",
            actorId: reporterId,
            targetId: studentId,
            metadata: { requestId, reasonSummary: reason.substring(0, 50) },
            timestamp: FieldValue.serverTimestamp(),
            tenantId,
        });

        return { success: true, reportId: reportRef.id };
    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("reportStudent error:", error);
        throw new functions.https.HttpsError("internal", "Failed to submit report.");
    }
});
