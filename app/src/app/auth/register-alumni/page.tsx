"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth";
import { registerAlumni } from "@/services/api";

export default function RegisterAlumniPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        displayName: "",
        bio: "",
        company: "",
        role: "",
        mentorOptIn: false,
        referralOptIn: false,
        tenantId: "default-tenant", // MVP: Hardcoded
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Please log in first.</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await registerAlumni(formData);
            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to submit application.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-black to-black blur-3xl opacity-50" />

            <div className="w-full max-w-2xl">
                <div className="bg-zinc-950 border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-2xl backdrop-blur-xl relative group">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 mb-6 rounded-3xl bg-zinc-900 border border-white/10 p-3 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                            <img src="/logo.jpeg" alt="Code Wizards Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Alumni Application</h1>
                        <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase text-center">Join the Mentor Network</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
                            <span className="text-lg">⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Display Name</label>
                            <input
                                required
                                type="text"
                                value={formData.displayName}
                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                placeholder="Your Full Name"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Current Company</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                    placeholder="e.g. Google, Microsoft"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Current Role</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700"
                                    placeholder="e.g. Senior Engineer"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700 h-24 resize-none"
                                placeholder="Briefly describe your career path..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 cursor-pointer hover:bg-zinc-900 transition-all group">
                                <input
                                    type="checkbox"
                                    checked={formData.mentorOptIn}
                                    onChange={e => setFormData({ ...formData, mentorOptIn: e.target.checked })}
                                    className="w-5 h-5 rounded-lg accent-white"
                                />
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-all">Agree to Mentor</span>
                            </label>
                            <label className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 cursor-pointer hover:bg-zinc-900 transition-all group">
                                <input
                                    type="checkbox"
                                    checked={formData.referralOptIn}
                                    onChange={e => setFormData({ ...formData, referralOptIn: e.target.checked })}
                                    className="w-5 h-5 rounded-lg accent-white"
                                />
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-all">Offer Referrals</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-white text-black font-black py-5 rounded-3xl hover:bg-zinc-200 transition-all active:scale-95 text-xs tracking-[0.2em] uppercase mt-4 disabled:opacity-50"
                        >
                            {submitting ? "Processing..." : "Submit Application"}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <button
                            onClick={() => router.push("/")}
                            className="text-[10px] font-black text-white hover:text-zinc-400 transition-all tracking-widest"
                        >
                            RETURN TO HOME
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
