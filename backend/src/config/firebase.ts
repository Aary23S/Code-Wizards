import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './code-wizards-key.json';

let serviceAccount;
try {
    const fullPath = path.resolve(serviceAccountPath);
    if (fs.existsSync(fullPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } else {
        console.warn(`⚠️ Service account key not found at ${fullPath}`);
        console.log('Using default credentials from environment...');
    }
} catch (error) {
    console.error('Error loading service account key:', error);
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
} else {
    // Fallback to application default credentials
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

export const db = admin.firestore();
export const auth = admin.auth();

console.log('✅ Firebase Admin initialized');
