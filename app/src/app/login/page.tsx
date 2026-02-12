"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard"); // Redirect to dashboard after login
        } catch (err: any) {
            setError("Invalid email or password.");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-black to-black blur-3xl opacity-50" />

            <div className="w-full max-w-md">
                <div className="bg-zinc-950 border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-2xl backdrop-blur-xl relative group">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-24 h-24 mb-6 rounded-3xl bg-zinc-900 border border-white/10 p-3 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                            <img src="/logo.jpeg" alt="Code Wizards Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Login Center</h1>
                        <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase text-center">Identity Verification Required</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
                            <span className="text-lg">⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Terminal</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                placeholder="wizard@university.edu"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Access Cipher</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 text-xs tracking-widest uppercase mt-4"
                        >
                            Establish Connection
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-zinc-600 text-xs font-medium mb-4">New to the hub?</p>
                        <button
                            onClick={() => router.push("/")}
                            className="text-[10px] font-black text-white hover:text-zinc-400 transition-all tracking-widest"
                        >
                            RETURN TO LANDING
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
