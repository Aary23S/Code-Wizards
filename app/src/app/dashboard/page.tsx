"use client";

import { useAuth } from "@/services/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    if (loading) return <div>Loading...</div>;
    if (!user) {
        router.push("/login");
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-zinc-800 pb-20">
            {/* Header */}
            <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div onClick={() => router.push("/")} className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 transition-all duration-500 group-hover:border-white/20 group-hover:scale-105">
                            <img
                                src="/logo.jpeg"
                                alt="Code Wizards Logo"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter leading-none text-white uppercase">CODE WIZARDS</span>
                            <span className="text-[9px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Command Center</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.push("/profile")} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition">PROFILE</button>
                        <button onClick={() => auth.signOut()} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition">SIGN OUT</button>
                    </div>
                </div>
            </nav>

            <main className="pt-32 px-6 max-w-7xl mx-auto space-y-12">
                <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/10 p-2 overflow-hidden flex items-center justify-center">
                            <img src="/logo.jpeg" alt="Code Wizards Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white mb-1 italic tracking-tighter uppercase leading-none">DASHBOARD</h1>
                            <p className="text-zinc-500 text-[10px] font-black tracking-[0.2em] uppercase">Welcome back, {user.email?.split('@')[0]}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {/* Status Card */}
                        <div className="p-8 rounded-[2.5rem] bg-zinc-950 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition duration-1000" />
                            <div className="relative z-10">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">System Status</h3>
                                <div className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xl font-bold text-white uppercase tracking-tight">Active Terminal</span>
                                </div>
                                <div className="mt-6 flex flex-wrap gap-4">
                                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold">Role: <span className="text-white uppercase ml-1">{role || "Unset"}</span></div>
                                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold">UID: <span className="text-zinc-400 ml-1">{user.uid.slice(0, 8)}...</span></div>
                                </div>
                            </div>
                        </div>

                        {!role ? (
                            <div className="p-10 rounded-[3rem] bg-zinc-950 border border-yellow-500/20 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-yellow-500/5 blur-3xl rounded-full scale-50" />
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="max-w-md">
                                        <h3 className="text-2xl font-black text-white mb-2 italic tracking-tighter uppercase">ACTION REQUIRED</h3>
                                        <p className="text-zinc-500 text-sm leading-relaxed">Identity verification incomplete. Please register to access club features and community guidance.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                        <button onClick={() => router.push("/auth/register-student")} className="px-8 py-4 bg-white text-black font-black rounded-2xl text-[10px] tracking-widest uppercase hover:bg-zinc-200 transition whitespace-nowrap">Student Access</button>
                                        <button onClick={() => router.push("/auth/register-alumni")} className="px-8 py-4 bg-zinc-900 border border-white/10 text-white font-black rounded-2xl text-[10px] tracking-widest uppercase hover:bg-white/5 transition whitespace-nowrap">Alumni Portal</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center rounded-[3rem] border border-white/5 bg-zinc-950/30">
                                <p className="text-zinc-500 font-medium italic">Welcome to the core. Use the main portal to explore the community.</p>
                                <button onClick={() => router.push("/")} className="mt-8 px-10 py-4 bg-white text-black font-black rounded-2xl text-[10px] tracking-widest uppercase hover:bg-zinc-200 transition">Go to Community Hub</button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {/* Club Branding Side Card */}
                        <div className="p-8 rounded-[2.5rem] bg-zinc-950 border border-white/5 flex flex-col items-center text-center">
                            <div className="w-20 h-20 mb-6 rounded-[2rem] bg-zinc-900 border border-white/10 p-4 shadow-2xl">
                                <img src="/logo.jpeg" alt="Code Wizards Logo" className="w-full h-full object-contain" />
                            </div>
                            <h4 className="text-lg font-black text-white italic tracking-tighter uppercase">CODE WIZARDS</h4>
                            <p className="text-[10px] font-black tracking-[0.2em] text-zinc-600 uppercase mb-6">Innovation | Mentorship | Excellence</p>
                            <div className="w-full pt-6 border-t border-white/5 space-y-4">
                                <p className="text-zinc-500 text-xs px-2 italic">"Magic is just science we don't understand yet."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
