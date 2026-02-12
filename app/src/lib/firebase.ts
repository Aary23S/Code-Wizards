import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with real key from console later
    authDomain: "code-wizards-9e993.firebaseapp.com",
    projectId: "code-wizards-9e993",
    storageBucket: "code-wizards-9e993.appspot.com",
    messagingSenderId: "301868541330",
    appId: "APP_ID" // Replace with real ID from console later
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === "development") {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8081);
    connectFunctionsEmulator(functions, "localhost", 5001);
}
