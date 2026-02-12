"use client";

import { useState } from "react";
import { registerAlumni } from "@/services/api";
import { useAuth } from "@/services/auth";

interface AlumniRegistrationProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AlumniRegistration({ onSuccess, onCancel }: AlumniRegistrationProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        displayName: "",
        email: "",
        company: "",
        role: "",
        gradYear: new Date().getFullYear() - 4,
        expertise: "",
        bio: "",
        mentorOptIn: true,
        referralOptIn: false,
        tenantId: "default",
        socialLinks: {
            linkedin: "",
            github: ""
        }
    });

    const { refreshAuth } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const submissionData = {
                ...formData,
                expertise: formData.expertise.split(",").map(e => e.trim()).filter(e => e !== "")
            };
            await registerAlumni(submissionData);
            await refreshAuth();
            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Registration failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl rounded-[2.5rem] bg-zinc-950 border border-white/5 shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] relative overflow-hidden">
            {error && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">⚠️</span>
                            <p className="text-sm font-bold tracking-tight">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="p-1 hover:bg-white/10 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="p-8 pb-0">
                <h2 className="text-3xl font-bold mb-2 text-white tracking-tight text-center">Alumni Registration</h2>
                <p className="text-zinc-500 mb-8 text-sm text-center">Join as a mentor and give back to the next generation of wizards.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Display Name</label>
                            <input
                                required
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Primary Email</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="email@company.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Current Company</label>
                            <input
                                required
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="Google, Microsoft, etc."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Current Role</label>
                            <input
                                required
                                type="text"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="SDE, Product Manager, etc."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">LinkedIn Profile (URL)</label>
                            <input
                                required
                                type="url"
                                value={formData.socialLinks.linkedin}
                                onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Graduation Year</label>
                            <input
                                required
                                type="number"
                                value={formData.gradYear || ""}
                                onChange={(e) => setFormData({ ...formData, gradYear: parseInt(e.target.value) || 0 })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Areas of Expertise (Comma-separated)</label>
                        <input
                            required
                            type="text"
                            value={formData.expertise}
                            onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                            placeholder="React, Distributed Systems, Career Growth, etc."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Short Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition resize-none h-20"
                            placeholder="Brief experience summary..."
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.mentorOptIn}
                                onChange={(e) => setFormData({ ...formData, mentorOptIn: e.target.checked })}
                                className="w-5 h-5 bg-zinc-900 border-white/10 rounded cursor-pointer accent-white"
                            />
                            <span className="text-sm text-zinc-400 group-hover:text-white transition">Available for 1:1 mentorship</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.referralOptIn}
                                onChange={(e) => setFormData({ ...formData, referralOptIn: e.target.checked })}
                                className="w-5 h-5 bg-zinc-900 border-white/10 rounded cursor-pointer accent-white"
                            />
                            <span className="text-sm text-zinc-400 group-hover:text-white transition">Can provide referrals for company</span>
                        </label>
                    </div>

                </div>

                <div className="p-8 pt-4 border-t border-white/5 bg-zinc-950 rounded-b-[2.5rem]">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 border border-white/5 rounded-xl text-sm font-bold text-zinc-400 hover:bg-white/5 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-4 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 disabled:opacity-50 transition flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-black" />
                            ) : "Request Access"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
