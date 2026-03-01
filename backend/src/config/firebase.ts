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
        console.log('ℹ️ Will use environment variable credentials or Application Default Credentials');
    }
} catch (error) {
    console.error('Error loading service account key:', error);
}

try {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
    } else {
        // Fallback: Use Application Default Credentials (environment variables or gcloud config)
        admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
    }
    
    console.log('✅ Firebase Admin initialized successfully');
} catch (error: any) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    console.error('Please ensure:');
    console.error('  1. code-wizards-key.json exists in backend/ folder, OR');
    console.error('  2. GOOGLE_APPLICATION_CREDENTIALS environment variable is set, OR');
    console.error('  3. gcloud is authenticated: gcloud auth application-default login');
    process.exit(1);
}

export const db = admin.firestore();
export const auth = admin.auth();
