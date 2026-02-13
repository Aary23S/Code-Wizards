"use client";

import { useState } from "react";
import { registerStudent } from "@/services/api";
import { useAuth } from "@/services/auth";

interface StudentRegistrationProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function StudentRegistration({ onSuccess, onCancel }: StudentRegistrationProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        displayName: "",
        email: "",
        branch: "",
        division: "",
        rollNo: "",
        prnNo: "",
        year: new Date().getFullYear(),
        bio: "",
        skills: [] as string[],
        tenantId: "default"
    });

    const { refreshAuth } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await registerStudent(formData);
            await refreshAuth();
            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Registration failed. Check console for details.");
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

            <div className="p-8 pb-0 flex flex-col items-center">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-zinc-900 border border-white/5 p-2 overflow-hidden shadow-2xl">
                    <img src="/logo.jpeg" alt="Code Wizards Logo" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-white tracking-tight text-center">Student Registration</h2>
                <p className="text-zinc-500 mb-8 text-sm text-center">Complete your academic profile to join the wizarding community.</p>
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
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">University Email</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="email@university.edu"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Branch</label>
                            <input
                                required
                                type="text"
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="Computer Science, IT, etc."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Division</label>
                            <input
                                required
                                type="text"
                                value={formData.division}
                                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="A, B, C..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Roll Number</label>
                            <input
                                required
                                type="text"
                                value={formData.rollNo}
                                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="12345"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">PRN Number</label>
                            <input
                                required
                                type="text"
                                value={formData.prnNo}
                                onChange={(e) => setFormData({ ...formData, prnNo: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                                placeholder="University ID"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Graduation Year</label>
                            <input
                                required
                                type="number"
                                min={2020}
                                max={2030}
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Bio (Optional)</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition resize-none h-20"
                            placeholder="Tell us about yourself..."
                        />
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
                                <>
                                    <div className="h-4 w-4 border-2 border-zinc-400 border-t-black rounded-full animate-spin" />
                                </>
                            ) : "Complete Registration"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
