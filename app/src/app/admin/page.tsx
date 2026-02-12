"use client";

import AdminPortal from "@/components/admin/AdminPortal";
import { useAuth } from "@/services/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
    const { user, loading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || role !== "admin")) {
            router.push("/");
        }
    }, [user, loading, role, router]);

    if (loading || !user || role !== "admin") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <nav className="fixed top-0 w-full z-50 px-8 py-6 border-b border-white/5 bg-black/80 backdrop-blur-3xl">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl">
                            <span className="text-black font-black text-xl italic">CW</span>
                        </div>
                        <span className="text-zinc-500 font-black text-[10px] tracking-widest italic uppercase">Governance Terminal</span>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="text-zinc-500 hover:text-white transition font-black text-[10px] tracking-widest"
                    >
                        BACK TO COMMUNITY
                    </button>
                </div>
            </nav>

            <main className="pt-32 px-8 max-w-7xl mx-auto pb-24">
                <AdminPortal />
            </main>
        </div>
    );
}
