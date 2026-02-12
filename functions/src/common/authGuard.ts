import * as functions from "firebase-functions";

type UserRole = "student" | "alumni" | "admin";

/**
 * Validates that a user is authenticated and possesses one of the required roles.
 * @param {functions.https.CallableContext} context - The callable context.
 * @param {UserRole[]} requiredRoles - Array of allowed roles.
 * @throws {functions.https.HttpsError} If unauthenticated or unauthorized.
 */
export const assertRole = (
    context: functions.https.CallableContext,
    requiredRoles: UserRole[]
): void => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The user must be authenticated."
        );
    }

    const token = context.auth.token;
    const userRole = token.role as UserRole | undefined;

    if (!userRole || !requiredRoles.includes(userRole)) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "The user does not have the required role to access this resource."
        );
    }
};

/**
 * Validates that a user is simply authenticated (no specific role required).
 * @param {functions.https.CallableContext} context - The callable context.
 */
export const assertAuth = (context: functions.https.CallableContext): void => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The user must be authenticated."
        );
    }
};
