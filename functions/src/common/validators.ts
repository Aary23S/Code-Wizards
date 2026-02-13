import { z } from "zod";

// Common Schemas
export const tenantIdSchema = z.string().min(1, "Tenant ID is required.");

// Registration & Profile Schemas
// Helper: Allow empty strings or valid URLs
const urlOrEmpty = () => z.union([
    z.string().url(),
    z.literal("")
]).optional();

export const socialLinksSchema = z.object({
    github: urlOrEmpty(),
    linkedin: urlOrEmpty(),
    twitter: urlOrEmpty(),
    website: urlOrEmpty(),
}).optional();

export const codingProfilesSchema = z.object({
    leetcode: urlOrEmpty(),
    codechef: urlOrEmpty(),
    codeforces: urlOrEmpty(),
    hackerrank: urlOrEmpty(),
}).optional();

export const registerStudentSchema = z.object({
    displayName: z.string().min(2).max(50),
    email: z.string().email(),
    branch: z.string().min(2),
    division: z.string().min(1),
    rollNo: z.string().min(1),
    prnNo: z.string().min(1),
    year: z.number().int().min(2020).max(2030),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).max(15).optional(),
    address: z.string().max(200).optional(),
    socialLinks: socialLinksSchema,
    codingProfiles: codingProfilesSchema,
    resumeUrl: urlOrEmpty(),
    profilePicUrl: urlOrEmpty(),
    tenantId: tenantIdSchema,
});

export const registerAlumniSchema = z.object({
    displayName: z.string().min(2).max(50),
    email: z.string().email(),
    company: z.string().min(2).max(100),
    role: z.string().min(2).max(100),
    gradYear: z.number().int().min(1980).max(2030),
    expertise: z.array(z.string()).min(1).max(10),
    bio: z.string().max(500).optional(),
    mentorOptIn: z.boolean().default(true),
    referralOptIn: z.boolean().default(false),
    socialLinks: socialLinksSchema,
    address: z.string().max(200).optional(),
    resumeUrl: urlOrEmpty(),
    profilePicUrl: urlOrEmpty(),
    privacySettings: z.object({
        showEmail: z.boolean().default(false),
        showLinkedIn: z.boolean().default(true),
        showCompany: z.boolean().default(true),
    }).optional(),
    tenantId: tenantIdSchema,
});

export const updateProfileSchema = z.object({
    displayName: z.string().min(2).max(50).optional(),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).max(15).optional(),
    expertise: z.array(z.string()).max(10).optional(),
    company: z.string().max(100).optional(),
    role: z.string().max(100).optional(),
    gradYear: z.number().int().min(1980).max(2030).optional(),
    branch: z.string().min(2).optional(),
    division: z.string().min(1).optional(),
    rollNo: z.string().min(1).optional(),
    prnNo: z.string().min(1).optional(),
    year: z.number().int().min(2020).max(2030).optional(),
    address: z.string().max(200).optional(),
    socialLinks: socialLinksSchema,
    codingProfiles: codingProfilesSchema,
    resumeUrl: urlOrEmpty(),
    profilePicUrl: urlOrEmpty(),
    mentorOptIn: z.boolean().optional(),
    referralOptIn: z.boolean().optional(),
    privacySettings: z.object({
        showEmail: z.boolean().optional(),
        showLinkedIn: z.boolean().optional(),
        showCompany: z.boolean().optional(),
    }).optional(),
});

// Admin Action Schemas
export const approveAlumniSchema = z.object({
    uid: z.string().min(1),
    tenantId: tenantIdSchema,
});


export const suspendUserSchema = z.object({
    uid: z.string().min(1),
    reason: z.string().min(5),
});

// Post Schemas
export const createPostSchema = z.object({
    title: z.string().min(1).max(100),
    content: z.string().min(1).max(2000),
    tags: z.array(z.string()).max(5),
    tenantId: tenantIdSchema,
});

export const updatePostSchema = z.object({
    postId: z.string().min(1),
    title: z.string().min(5).max(100).optional(),
    content: z.string().min(10).max(2000).optional(),
    tags: z.array(z.string()).max(5).optional(),
});

export const likePostSchema = z.object({
    postId: z.string().min(1),
});

export const commentPostSchema = z.object({
    postId: z.string().min(1),
    content: z.string().min(1).max(500),
});

// Guidance Schemas
export const requestGuidanceSchema = z.object({
    mentorId: z.string().min(1).optional(),
    topic: z.string().min(5).max(100),
    message: z.string().min(10).max(1000),
    type: z.enum(["mentorship", "referral"]).default("mentorship"),
    tenantId: tenantIdSchema,
});

export const replyGuidanceSchema = z.object({
    requestId: z.string().min(1),
    response: z.string().min(10).max(1000),
    status: z.enum(["accepted", "declined", "completed"]).optional(),
});

export const reportStudentSchema = z.object({
    studentId: z.string().min(1),
    requestId: z.string().min(1).optional(),
    reason: z.string().min(10).max(500),
    tenantId: tenantIdSchema,
});

export const transitionToAlumniSchema = z.object({
    company: z.string().min(2).max(100),
    role: z.string().min(2).max(100),
    gradYear: z.number().int().min(1980).max(2030),
    expertise: z.array(z.string()).min(1).max(10),
    bio: z.string().max(500).optional(),
    socialLinks: socialLinksSchema,
    tenantId: tenantIdSchema,
});

export const createAnnouncementSchema = z.object({
    title: z.string().min(5).max(100),
    content: z.string().min(10).max(1000),
    type: z.enum(["info", "warning", "success", "event"]).default("info"),
    tenantId: tenantIdSchema,
});

export const resolveSafetyReportSchema = z.object({
    reportId: z.string().min(1),
    resolution: z.string().min(5).max(500),
    action: z.enum(["none", "warning", "suspend"]).default("none"),
    tenantId: tenantIdSchema,
});

export const promoteToAdminSchema = z.object({
    uid: z.string().min(1),
    tenantId: tenantIdSchema,
});

export const searchUsersSchema = z.object({
    query: z.string().min(2),
    tenantId: tenantIdSchema,
});
