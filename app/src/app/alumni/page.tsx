"use client";

import { useAuth } from "@/services/auth";
import { useRouter } from "next/navigation";
import AlumniDashboard from "@/components/alumni/AlumniDashboard";
import PostFeed from "@/components/community/PostFeed";
import ClubActivities from "@/components/community/ClubActivities";
import Loader from "@/components/common/Loader";
import { auth } from "@/lib/firebase";

export default function AlumniPage() {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return <Loader variant="code" size="lg" fullScreen={true} text="Initializing alumni profile..." />;
    }

    // Redirect non-alumni users
    if (!user) {
        router.push("/login");
        return null;
    }

    if (role !== "alumni" && role !== "admin") {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">Access Denied</h1>
                    <p className="text-zinc-400">This section is restricted to alumni. Please register as an alumni first.</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-zinc-800 pb-20">
            {/* Navigation */}
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
                            <span className="text-[9px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Alumni Command</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push("/profile")}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition"
                        >
                            PROFILE
                        </button>
                        {role === "admin" && (
                            <button
                                onClick={() => router.push("/admin")}
                                className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition border border-emerald-500/30 px-3 py-1 rounded-full"
                            >
                                ADMIN
                            </button>
                        )}
                        <button
                            onClick={() => {
                                auth.signOut();
                                router.push("/");
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition"
                        >
                            SIGN OUT
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-20">
                <div className="space-y-20">
                    {/* Alumni Dashboard */}
                    <AlumniDashboard />

                    {/* Community Feed */}
                    <section className="max-w-7xl mx-auto px-6">
                        <PostFeed />
                    </section>

                    {/* Club Activities */}
                    <section className="max-w-7xl mx-auto px-6">
                        <ClubActivities mode="community" />
                    </section>
                </div>
            </main>
        </div>
    );
}
