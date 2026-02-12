// College authority emails who get automatic admin access
// Add your college authority emails here
export const ADMIN_WHITELIST = [
    // Example: "principal@college.edu",
    // Example: "dean@college.edu",

    // For development/testing - replace with your email
    "satardekaraary@gmail.com",
];

/**
 * Check if an email is whitelisted for automatic admin access
 * @param email - Email address to check
 * @returns true if email is in the admin whitelist
 */
export function isWhitelistedAdmin(email: string): boolean {
    return ADMIN_WHITELIST.includes(email.toLowerCase());
}
