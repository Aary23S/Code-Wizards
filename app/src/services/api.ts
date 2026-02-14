import { auth } from "@/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Generic wrapper for API calls
export const callApi = async <TRequest, TResponse>(
    endpoint: string,
    method: string = "POST",
    data?: TRequest
): Promise<TResponse> => {
    try {
        const token = await auth.currentUser?.getIdToken();
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "API request failed");
        }

        return await response.json();
    } catch (error) {
        console.error(`Error calling ${endpoint}:`, error);
        throw error;
    }
};

// Typed helpers - Users
export const registerStudent = (data: any) => 
    callApi<any, any>("/users/register-student", "POST", data);

export const registerAlumni = (data: any) => 
    callApi<any, any>("/users/register-alumni", "POST", data);

export const getProfile = (userId?: string) => 
    callApi<any, any>("/users/profile", "GET");

export const updateProfile = (data: any) => 
    callApi<any, any>("/users/profile", "PATCH", data);

// Posts
export const createPost = (data: any) => 
    callApi<any, any>("/posts", "POST", data);

export const getPosts = (data: { limit?: number; startAfter?: string }) => 
    callApi<any, any>("/posts", "GET");

export const deletePost = (data: { postId: string }) => 
    callApi<any, any>(`/posts/${data.postId}`, "DELETE");

export const likePost = (data: { postId: string }) => 
    callApi<any, any>(`/posts/${data.postId}/like`, "POST", data);

export const commentPost = (data: { postId: string; content: string }) => 
    callApi<any, any>(`/posts/${data.postId}/comment`, "POST", data);

// Guidance
export const requestGuidance = (data: any) => 
    callApi<any, any>("/guidance/request", "POST", data);

export const replyToGuidance = (data: { requestId: string; reply: string }) => 
    callApi<any, any>(`/guidance/${data.requestId}/reply`, "POST", data);

// Alumni
export const getAlumniStats = () => 
    callApi<any, any>("/alumni/stats", "GET");

export const getFilteredRequests = () => 
    callApi<any, any[]>("/guidance/filtered", "GET");

export const acceptGuidanceRequest = (requestId: string) => 
    callApi<any, any>(`/guidance/${requestId}/accept`, "POST");

// Safety
export const reportStudent = (data: { studentId: string; reason: string; requestId?: string; tenantId: string }) => 
    callApi<any, any>("/safety/report", "POST", data);

// Transitions
export const transitionToAlumni = (data: any) => 
    callApi<any, any>("/users/transition-alumni", "POST", data);

export const getActivityHistory = (userId?: string) => 
    callApi<any, any[]>("/users/activity", "GET");

// Admin Helpers
export const getAdminDashboardStats = () => 
    callApi<any, any>("/admin/dashboard", "GET");

export const approveAlumni = (uid: string, tenantId: string) => 
    callApi<any, any>("/admin/approve-alumni", "POST", { uid, tenantId });

export const createAnnouncement = (data: any) => 
    callApi<any, any>("/admin/announcements", "POST", data);

export const resolveSafetyReport = (data: any) => 
    callApi<any, any>("/admin/safety-reports", "POST", data);
export const suspendUser = (uid: string, reason: string) => callFunction("adminActions-suspendUser", { uid, reason });
export const promoteToAdmin = (uid: string, tenantId: string) => callFunction("adminActions-promoteToAdmin", { uid, tenantId });
export const searchUsers = (query: string, tenantId: string = "default") => callFunction<{ query: string, tenantId: string }, { users: any[] }>("adminActions-searchUsers", { query, tenantId });
