"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    onIdTokenChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    role: string | null;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    role: null,
    refreshAuth: async () => { },
});

let isSigningIn = false;

export const signInWithGoogle = async () => {
    if (isSigningIn) return false;
    isSigningIn = true;

    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        return true;
    } catch (error: any) {
        if (error.code === "auth/cancelled-popup-request") {
            console.warn("Sign-in popup was cancelled by a newer request.");
        } else if (error.code === "auth/popup-closed-by-user") {
            console.log("User closed the auth popup.");
        } else {
            console.error("Error signing in with Google", error);
        }
        return false;
    } finally {
        isSigningIn = false;
    }
};

export const logout = () => signOut(auth);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        // onIdTokenChanged triggers when user signs in/out OR token is refreshed (claims update)
        const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                const tokenResult = await currentUser.getIdTokenResult();
                setRole((tokenResult.claims.role as string) || null);
            } else {
                setRole(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshAuth = async () => {
        if (auth.currentUser) {
            await auth.currentUser.getIdToken(true);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, role, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
