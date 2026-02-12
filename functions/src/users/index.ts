import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { assertAuth } from "../common/authGuard";
import { registerStudentSchema, registerAlumniSchema, updateProfileSchema, transitionToAlumniSchema } from "../common/validators";
import { isWhitelistedAdmin } from "../config/adminWhitelist";

const db = admin.firestore();
const auth = admin.auth();

export const registerStudent = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
        assertAuth(context);
        const uid = context.auth!.uid;

        // 1. Validate Input
        const result = registerStudentSchema.safeParse(data);
        if (!result.success) {
            console.error("Validation failed:", result.error.format());
            throw new functions.https.HttpsError("invalid-argument", "Invalid input data.", result.error.format());
        }
        const parsed = result.data;

        // 2. Check if user already has a role
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims?.role) {
            throw new functions.https.HttpsError("already-exists", "User already registered.");
        }

        // 3. Check if email is whitelisted for admin access
        const isAdmin = isWhitelistedAdmin(parsed.email);
        const role = isAdmin ? "admin" : "student";
        const status = "active";

        // 4. Set Custom Claims
        await auth.setCustomUserClaims(uid, { role, status });

        // 5. Create Firestore Documents
        const batch = db.batch();
        const userRef = db.collection("users").doc(uid);
        batch.set(userRef, {
            role,
            status,
            email: parsed.email,
            tenantId: parsed.tenantId,
            createdAt: FieldValue.serverTimestamp(),
        });

        const profileRef = db.collection("profiles").doc(uid);
        batch.set(profileRef, {
            userId: uid,
            displayName: parsed.displayName,
            email: parsed.email,
            branch: parsed.branch,
            division: parsed.division,
            rollNo: parsed.rollNo,
            prnNo: parsed.prnNo,
            year: parsed.year,
            bio: parsed.bio || "",
            skills: parsed.skills || [],
            address: parsed.address || "",
            socialLinks: parsed.socialLinks || {},
            codingProfiles: parsed.codingProfiles || {},
            resumeUrl: parsed.resumeUrl || "",
            profilePicUrl: parsed.profilePicUrl || "",
            visibility: "public",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();
        return { success: true, message: "Student registered successfully." };
    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("Registration internal error:", error);
        throw new functions.https.HttpsError("internal", error.message || "An unexpected error occurred.");
    }
});

export const registerAlumni = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
        assertAuth(context);
        const uid = context.auth!.uid;

        const result = registerAlumniSchema.safeParse(data);
        if (!result.success) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid data", result.error.format());
        }
        const parsed = result.data;

        // 2. Check overlap
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims?.role) {
            throw new functions.https.HttpsError("already-exists", "User already registered.");
        }

        // 3. Check if email is whitelisted for admin access
        const isAdmin = isWhitelistedAdmin(parsed.email);
        const role = isAdmin ? "admin" : "alumni";
        const status = isAdmin ? "active" : "pending";

        // 4. Set Claims
        await auth.setCustomUserClaims(uid, { role, status });

        // 5. Create Docs
        const batch = db.batch();

        const userRef = db.collection("users").doc(uid);
        batch.set(userRef, {
            role,
            status,
            email: parsed.email,
            tenantId: parsed.tenantId,
            createdAt: FieldValue.serverTimestamp(),
        });

        const profileRef = db.collection("profiles").doc(uid);
        batch.set(profileRef, {
            userId: uid,
            displayName: parsed.displayName,
            email: parsed.email,
            bio: parsed.bio || "",
            skills: [],
            socialLinks: parsed.socialLinks || {},
            address: parsed.address || "",
            resumeUrl: parsed.resumeUrl || "",
            profilePicUrl: parsed.profilePicUrl || "",
            privacySettings: parsed.privacySettings || {
                showEmail: false,
                showLinkedIn: true,
                showCompany: true
            },
            visibility: "public",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        const alumniMetaRef = db.collection("alumniMeta").doc(uid);
        batch.set(alumniMetaRef, {
            userId: uid,
            company: parsed.company,
            role: parsed.role,
            gradYear: parsed.gradYear,
            expertise: parsed.expertise,
            mentorOptIn: parsed.mentorOptIn,
            referralOptIn: parsed.referralOptIn,
            privacySettings: parsed.privacySettings || {
                showEmail: false,
                showLinkedIn: true,
                showCompany: true
            },
            createdAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();
        return { success: true, message: "Alumni application submitted." };
    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("registerAlumni error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to register alumni.");
    }
});

export const getProfile = functions.https.onCall(async (data: { userId?: string }, context: functions.https.CallableContext) => {
    assertAuth(context);
    const targetUid = data.userId || context.auth!.uid;

    const profileDoc = await db.collection("profiles").doc(targetUid).get();
    if (!profileDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Profile not found");
    }

    const profileData = profileDoc.data();
    if (!profileData) return null;

    // Redaction logic for privacy
    const isOwner = targetUid === context.auth!.uid;
    const isAdmin = context.auth!.token.role === "admin";

    if (!isOwner && !isAdmin) {
        const privacy = profileData.privacySettings;
        if (privacy) {
            if (!privacy.showEmail) delete profileData.email;
            if (!privacy.showLinkedIn && profileData.socialLinks) {
                delete profileData.socialLinks.linkedin;
            }
        }
    }

    return profileData;
});

export const updateProfile = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    assertAuth(context);
    const uid = context.auth!.uid;

    const result = updateProfileSchema.safeParse(data);
    if (!result.success) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid profile data.", result.error.format());
    }
    const parsed = result.data;

    const profileRef = db.collection("profiles").doc(uid);
    await profileRef.update({
        ...parsed,
        updatedAt: FieldValue.serverTimestamp(),
    });

    // Sync with alumniMeta if applicable
    const userRecord = await auth.getUser(uid);
    const role = userRecord.customClaims?.role;

    if (role === "alumni") {
        const alumniMetaUpdate: any = {};
        if (parsed.gradYear !== undefined) alumniMetaUpdate.gradYear = parsed.gradYear;
        if (parsed.expertise !== undefined) alumniMetaUpdate.expertise = parsed.expertise;
        if (parsed.mentorOptIn !== undefined) alumniMetaUpdate.mentorOptIn = parsed.mentorOptIn;
        if (parsed.referralOptIn !== undefined) alumniMetaUpdate.referralOptIn = parsed.referralOptIn;
        if (parsed.privacySettings !== undefined) alumniMetaUpdate.privacySettings = parsed.privacySettings;

        if (Object.keys(alumniMetaUpdate).length > 0) {
            await db.collection("alumniMeta").doc(uid).update({
                ...alumniMetaUpdate,
                updatedAt: FieldValue.serverTimestamp()
            });
        }
    }

    if (parsed.displayName) {
        // Also update Auth record for consistency
        await auth.updateUser(uid, { displayName: parsed.displayName });
    }

    return { success: true };
});

export const transitionToAlumni = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
        assertAuth(context);
        const uid = context.auth!.uid;

        // 1. Validate Input
        const result = transitionToAlumniSchema.safeParse(data);
        if (!result.success) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid data.", result.error.format());
        }
        const parsed = result.data;

        // 2. Check current role
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims?.role !== "student") {
            throw new functions.https.HttpsError("failed-precondition", "Only students can transition to alumni.");
        }

        // 3. Update Claims to 'alumni/pending'
        await auth.setCustomUserClaims(uid, { role: "alumni", status: "pending" });

        // 4. Update Docs
        const batch = db.batch();

        const userRef = db.collection("users").doc(uid);
        batch.update(userRef, {
            role: "alumni",
            status: "pending",
            updatedAt: FieldValue.serverTimestamp(),
        });

        const profileRef = db.collection("profiles").doc(uid);
        batch.update(profileRef, {
            bio: parsed.bio || "",
            socialLinks: parsed.socialLinks || {},
            updatedAt: FieldValue.serverTimestamp(),
        });

        const alumniMetaRef = db.collection("alumniMeta").doc(uid);
        batch.set(alumniMetaRef, {
            userId: uid,
            company: parsed.company,
            role: parsed.role,
            gradYear: parsed.gradYear,
            expertise: parsed.expertise,
            mentorOptIn: false,
            referralOptIn: false,
            privacySettings: {
                showEmail: false,
                showLinkedIn: true,
                showCompany: true
            },
            transitionedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();
        return { success: true, message: "Transition initiated. Awaiting admin approval." };
    } catch (error: any) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("transitionToAlumni error:", error);
        throw new functions.https.HttpsError("internal", "Failed to transition to alumni.");
    }
});

export const getActivityHistory = functions.https.onCall(async (data: { userId?: string }, context: functions.https.CallableContext) => {
    assertAuth(context);
    const targetUid = data.userId || context.auth!.uid;

    try {
        // Fetch Posts
        const postsSnap = await db.collection("posts")
            .where("authorId", "==", targetUid)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const posts = postsSnap.docs.map(doc => ({
            id: doc.id,
            type: "POST",
            title: doc.data().title,
            createdAt: doc.data().createdAt,
        }));

        // Fetch Guidance (as student or mentor)
        const studentRequestsSnap = await db.collection("guidanceRequests")
            .where("studentId", "==", targetUid)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const mentorRequestsSnap = await db.collection("guidanceRequests")
            .where("mentorId", "==", targetUid)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const guidance = [
            ...studentRequestsSnap.docs.map(doc => ({
                id: doc.id,
                type: "GUIDANCE_REQUESTED",
                topic: doc.data().topic,
                status: doc.data().status,
                createdAt: doc.data().createdAt,
            })),
            ...mentorRequestsSnap.docs.map(doc => ({
                id: doc.id,
                type: "GUIDANCE_JOINED",
                topic: doc.data().topic,
                status: doc.data().status,
                createdAt: doc.data().createdAt,
            }))
        ];

        // Combine and sort
        const history = [...posts, ...guidance].sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });

        return history;
    } catch (error: any) {
        console.error("getActivityHistory error details:", error);
        throw new functions.https.HttpsError("internal", `getActivityHistory failed: ${error.message}`);
    }
});
