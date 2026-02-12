import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

export interface AuditLogEntry {
    adminId: string;
    action: string;
    targetId: string;
    metadata?: Record<string, any>;
    createdAt: FieldValue;
}

/**
 * Logs an administrative action to the 'adminAuditLogs' collection.
 * This is a critical security requirement.
 *
 * @param {string} adminId - The UID of the admin performing the action.
 * @param {string} action - The type of action performed (e.g., 'approve_alumni').
 * @param {string} targetId - The ID of the affected resource (usually a UID).
 * @param {Record<string, any>} [metadata] - Optional additional context.
 */
export const logAdminAction = async (
    adminId: string,
    action: string,
    targetId: string,
    metadata?: Record<string, any>
): Promise<void> => {
    try {
        await admin.firestore().collection("adminAuditLogs").add({
            adminId,
            action,
            targetId,
            metadata: metadata || {},
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (error) {
        // Critical failure: If audit logging fails, we must alert.
        functions.logger.error("Failed to write audit log", {
            adminId,
            action,
            targetId,
            error,
        });
        // In a stricter system, we might throw here to rollback the transaction,
        // but for now, we ensure the error is logged to GCP.
    }
};
