// Admin email whitelist - add admin emails here
export const ADMIN_WHITELIST = [
    'admin@code-wizards.com',
    'orangealgae@gmail.com', // Add your actual admin email
];

export const isWhitelistedAdmin = (email: string): boolean => {
    return ADMIN_WHITELIST.includes(email.toLowerCase());
};
