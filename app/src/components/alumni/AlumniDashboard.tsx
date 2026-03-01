"use client";

import { useEffect, useState } from "react";
import { getProfile, updateProfile, createPost } from "@/services/api";
import { useAuth } from "@/services/auth";
import GuidancePortal from "./GuidancePortal";

const CreatePostModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await createPost({ title, content, type: "insight" });
            alert("Insight post published to the community.");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Post failed:", error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[3rem] p-12 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-24 -mt-24" />

                <div className="space-y-2">
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">CREATE INSIGHT</h3>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Share your expertise with the next generation</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Title</label>
                        <input
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                            placeholder="e.g., Transitioning from Student to FAANG Engineer"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Content</label>
                        <textarea
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={sending}
                            className="w-full h-48 bg-zinc-900 border border-white/5 rounded-2xl p-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition resize-none leading-relaxed disabled:opacity-50"
                            placeholder="Share your experience, advice, or technical insights..."
                        />
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-2xl font-black text-[10px] tracking-widest hover:text-white transition uppercase">CANCEL</button>
                        <button
                            type="submit"
                            disabled={sending}
                            className="flex-1 py-5 bg-white text-black rounded-2xl font-black text-[10px] tracking-widest hover:bg-zinc-200 transition disabled:opacity-50 uppercase"
                        >
                            {sending ? "PUBLISHING..." : "PUBLISH POST"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function AlumniDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [view, setView] = useState<"overview" | "guidance">("overview");
    const [showPostModal, setShowPostModal] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProfile();
            setStats(data);
        } catch (error: any) {
            console.error("Error fetching profile:", error);
            setError(error.message || "Failed to load profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleOptIn = async (field: "mentorOptIn" | "referralOptIn") => {
        setUpdating(field);
        try {
            await updateProfile({ [field]: !stats[field] });
            await fetchStats();
        } catch (error) {
            console.error(`Error toggling ${field}:`, error);
        } finally {
            setUpdating(null);
        }
    };

    const getRelativeDate = (timestamp: any) => {
        if (!timestamp) return "";
        const date = new Date(timestamp._seconds * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto py-12 px-6 animate-pulse space-y-12">
                <div className="h-40 rounded-[2.5rem] bg-zinc-900 border border-white/5" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-3xl bg-zinc-900 border border-white/5" />)}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-7xl mx-auto py-12 px-6">
                <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] space-y-4">
                    <h3 className="text-2xl font-black text-red-500 uppercase tracking-tighter">Error Loading Dashboard</h3>
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={fetchStats}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const statusColors: any = {
        pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        suspended: "text-red-400 bg-red-400/10 border-red-400/20",
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-12 px-6 space-y-16 animate-in fade-in duration-700">
            {showPostModal && (
                <CreatePostModal
                    onClose={() => setShowPostModal(false)}
                    onSuccess={fetchStats}
                />
            )}

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setView("overview")}
                    className={`px-10 py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all duration-300 ${view === "overview" ? "bg-white text-black shadow-xl shadow-white/5" : "text-zinc-500 hover:text-white bg-zinc-900 border border-white/5"}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setView("guidance")}
                    className={`px-10 py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all duration-300 ${view === "guidance" ? "bg-white text-black shadow-xl shadow-white/5" : "text-zinc-500 hover:text-white bg-zinc-900 border border-white/5"}`}
                >
                    Guidance Portal
                </button>
            </div>

            {view === "overview" ? (
                <>
                    <div className="bg-zinc-950 border border-white/5 p-12 rounded-[3.5rem] relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-10">
                            <span className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${statusColors[stats.status] || 'text-zinc-500 border-white/5'}`}>
                                {stats.status || 'Verified'}
                            </span>
                        </div>

                        <div className="space-y-12">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/10 p-2 overflow-hidden flex items-center justify-center">
                                    <img src="/logo.jpeg" alt="Code Wizards Logo" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-white mb-3 italic tracking-tighter uppercase leading-none">ALUMNI COMMAND</h2>
                                    <p className="text-zinc-500 text-sm font-medium">System Operator: <span className="text-zinc-300">{user?.displayName}</span> • Accessing encrypted impact data.</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-6 p-6 bg-zinc-900 border border-white/10 rounded-3xl hover:border-emerald-500/30 transition-all duration-500">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">MENTORSHIP NODE</p>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-sm font-black tracking-widest uppercase ${stats?.mentorOptIn ? "text-emerald-400" : "text-zinc-600"}`}>
                                                {stats?.mentorOptIn ? "ACTIVE" : "STANDBY"}
                                            </span>
                                            <button
                                                disabled={!!updating}
                                                onClick={() => toggleOptIn("mentorOptIn")}
                                                className={`w-12 h-6 rounded-full relative transition-all duration-500 ${stats?.mentorOptIn ? "bg-emerald-500" : "bg-zinc-800"} ${updating === "mentorOptIn" ? "opacity-50" : ""}`}
                                            >
                                                <div className={`absolute top-1.5 w-3 h-3 rounded-full bg-white transition-all duration-500 ${stats?.mentorOptIn ? "right-1.5" : "left-1.5"}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 p-6 bg-zinc-900 border border-white/10 rounded-3xl hover:border-emerald-500/30 transition-all duration-500">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">REFERRAL VECTOR</p>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-sm font-black tracking-widest uppercase ${stats?.referralOptIn ? "text-emerald-400" : "text-zinc-600"}`}>
                                                {stats?.referralOptIn ? "ACTIVE" : "STANDBY"}
                                            </span>
                                            <button
                                                disabled={!!updating}
                                                onClick={() => toggleOptIn("referralOptIn")}
                                                className={`w-12 h-6 rounded-full relative transition-all duration-500 ${stats?.referralOptIn ? "bg-emerald-500" : "bg-zinc-800"} ${updating === "referralOptIn" ? "opacity-50" : ""}`}
                                            >
                                                <div className={`absolute top-1.5 w-3 h-3 rounded-full bg-white transition-all duration-500 ${stats.referralOptIn ? "right-1.5" : "left-1.5"}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {stats.metrics?.pendingRequests > 0 && (
                                    <div className="flex items-center gap-4 p-6 bg-blue-500/10 rounded-3xl border border-blue-500/20 animate-pulse cursor-pointer group hover:bg-blue-500/20 transition-all" onClick={() => setView("guidance")}>
                                        <span className="text-blue-400 text-[10px] font-black tracking-widest uppercase">
                                            🚨 {stats.metrics.pendingRequests} URGENT REQUESTS DETECTED
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { label: "TRANSMISSIONS", value: stats.metrics?.totalResponses || 0, icon: "💬" },
                            { label: "ENGAGEMENTS", value: stats.metrics?.activeEngagements || 0, icon: "🤝" },
                            { label: "SOLUTIONS", value: stats.metrics?.closedRequests || 0, icon: "🏆" },
                            { label: "INTEL POSTS", value: stats.metrics?.postsCount || 0, icon: "✍️" },
                        ].map((metric, i) => (
                            <div key={i} className="p-10 bg-zinc-950 border border-white/5 rounded-[2.5rem] hover:border-zinc-700 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-3xl -mr-12 -mb-12 group-hover:bg-white/10 transition-all duration-1000" />
                                <div className="text-3xl mb-6 group-hover:scale-125 transition-transform duration-500 origin-left">{metric.icon}</div>
                                <div className="text-4xl font-black text-white mb-2 tracking-tighter leading-none">{metric.value}</div>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{metric.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                        <div className="lg:col-span-2 space-y-10">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                                SYSTEM BROADCASTS
                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse" />
                            </h3>

                            <div className="space-y-6">
                                {!stats.announcements || stats.announcements.length === 0 ? (
                                    <div className="p-24 text-center rounded-[3.5rem] border border-white/5 border-dashed bg-zinc-950/20">
                                        <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em]">All sectors clear. No broadcasts available.</p>
                                    </div>
                                ) : (
                                    stats.announcements.map((ann: any) => (
                                        <div key={ann.id} className="p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] hover:bg-zinc-900/40 transition-all duration-500 group">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase group-hover:text-blue-400 transition">{ann.title}</h4>
                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{getRelativeDate(ann.createdAt)}</span>
                                            </div>
                                            <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-6">{ann.content}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-zinc-900 text-zinc-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-white/5">ADMIN TRANSMISSION</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="space-y-10 focus-within:">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">OPERATIONS</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <button
                                    onClick={() => setView("guidance")}
                                    className="w-full p-8 text-left bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] font-black text-[10px] tracking-widest uppercase transition-all duration-500 flex items-center justify-between group shadow-2xl shadow-blue-900/40"
                                >
                                    Access Guidance Portal
                                    <span className="group-hover:translate-x-2 transition-transform duration-500 text-lg leading-none">→</span>
                                </button>
                                <button
                                    onClick={() => setShowPostModal(true)}
                                    className="w-full p-8 text-left bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-white/10 rounded-[2.5rem] font-black text-[10px] tracking-widest uppercase transition-all duration-500 group shadow-xl"
                                >
                                    Publish Insight Post
                                    <div className="mt-2 text-[8px] text-zinc-600 group-hover:text-zinc-400 transition">SHARE ARCHIVED WISDOM</div>
                                </button>
                                <button className="w-full p-8 text-left bg-zinc-950/30 text-zinc-800 border border-white/5 border-dashed rounded-[2.5rem] font-black text-[10px] tracking-widest uppercase cursor-not-allowed">
                                    Submit Feedback
                                    <div className="mt-2 text-[8px] text-zinc-900 italic">SECURE LINE CLOSED</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView("overview")} className="text-zinc-600 hover:text-white font-black text-[10px] tracking-widest uppercase flex items-center gap-3 transition group">
                            <span className="text-lg leading-none group-hover:-translate-x-1 transition-transform">←</span> Return to Command
                        </button>
                    </div>
                    <GuidancePortal alumniExpertise={[]} />
                </div>
            )}
        </div>
    );
}
