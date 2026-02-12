import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

// Generic wrapper for callable functions
export const callFunction = async <TRequest, TResponse>(
    functionName: string,
    data: TRequest
): Promise<TResponse> => {
    try {
        const fn = httpsCallable<TRequest, TResponse>(functions, functionName);
        const result = await fn(data);
        return result.data;
    } catch (error) {
        console.error(`Error calling ${functionName}:`, error);
        throw error;
    }
};

// Typed helpers
export const registerStudent = (data: any) => callFunction("users-registerStudent", data);
export const registerAlumni = (data: any) => callFunction("users-registerAlumni", data);

// Posts
export const createPost = (data: any) => callFunction("posts-createPost", data);
export const getPosts = (data: { limit?: number, startAfter?: string }) => callFunction("posts-getPosts", data);
export const deletePost = (data: { postId: string }) => callFunction("posts-deletePost", data);
export const likePost = (data: { postId: string }) => callFunction("posts-likePost", data);
export const commentPost = (data: { postId: string, content: string }) => callFunction("posts-commentPost", data);

// Profile
export const getProfile = (userId?: string) => callFunction<any, any>("users-getProfile", { userId });
export const updateProfile = (data: any) => callFunction<any, any>("users-updateProfile", data);

// Guidance
export const requestGuidance = (data: any) => callFunction("guidance-requestGuidance", data);
export const replyToGuidance = (data: { requestId: string, reply: string }) => callFunction("guidance-replyToGuidance", data);

// Alumni
export const getAlumniStats = () => callFunction<any, any>("alumni-getAlumniStats", {});
export const getFilteredRequests = () => callFunction<any, any[]>("alumni-getFilteredRequests", {});
export const acceptGuidanceRequest = (requestId: string) => callFunction("alumni-acceptGuidanceRequest", { requestId });
export const reportStudent = (data: { studentId: string; reason: string; requestId?: string; tenantId: string }) => callFunction("safety-reportStudent", data);
export const transitionToAlumni = (data: any) => callFunction("users-transitionToAlumni", data);
export const getActivityHistory = (userId?: string) => callFunction<any, any[]>("users-getActivityHistory", { userId });

// Admin Helpers
export const getAdminDashboardStats = () => callFunction<any, any>("adminActions-getAdminDashboardStats", {});
export const approveAlumni = (uid: string, tenantId: string) => callFunction("adminActions-approveAlumni", { uid, tenantId });
export const createAnnouncement = (data: any) => callFunction("adminActions-createAnnouncement", data);
export const resolveSafetyReport = (data: any) => callFunction("adminActions-resolveSafetyReport", data);
export const suspendUser = (uid: string, reason: string) => callFunction("adminActions-suspendUser", { uid, reason });
export const promoteToAdmin = (uid: string, tenantId: string) => callFunction("adminActions-promoteToAdmin", { uid, tenantId });
export const searchUsers = (query: string, tenantId: string = "default") => callFunction<{ query: string, tenantId: string }, { users: any[] }>("adminActions-searchUsers", { query, tenantId });
export const bootstrapAdmin = () => callFunction("adminActions-bootstrapAdmin", {});
