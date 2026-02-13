"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    getAdminDashboardStats,
    approveAlumni,
    resolveSafetyReport,
    searchUsers,
    promoteToAdmin,
    createAnnouncement,
    suspendUser,
    getActivityHistory
} from "@/services/api";
import {
    IdentificationIcon,
    ShieldExclamationIcon,
    DocumentMagnifyingGlassIcon,
    MegaphoneIcon,
    Bars3CenterLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UsersIcon,
    UserPlusIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import Loader from "@/components/common/Loader";

const UserProfileModal = ({ user, onClose }: { user: any, onClose: () => void }) => {
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [showActivities, setShowActivities] = useState(false);
    const [suspending, setSuspending] = useState(false);

    const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
            const data = await getActivityHistory(user.uid || user.id);
            setActivities(data);
            setShowActivities(true);
        } catch (error) {
            console.error("Failed to fetch activities:", error);
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleSuspend = async () => {
        if (!confirm(`Are you sure you want to suspend ${user.displayName}?`)) return;
        setSuspending(true);
        try {
            await suspendUser(user.uid || user.id, "Suspended by admin");
            alert("User suspended successfully");
            onClose();
        } catch (error) {
            console.error("Suspension failed:", error);
            alert("Failed to suspend user");
        } finally {
            setSuspending(false);
        }
    };

    if (!user) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[3rem] p-12 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                            <span className="text-3xl font-black text-white capitalize">{user.displayName?.[0] || "U"}</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white">{user.displayName}</h3>
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                    <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Role</p>
                        <p className="text-white font-bold">{user.role || 'User'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-emerald-500 font-bold">{user.status || 'Active'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">User ID</p>
                        <p className="text-zinc-400 font-mono text-xs">{user.uid || user.id}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Joined</p>
                        <p className="text-zinc-400 font-mono text-xs">
                            {user.createdAt?._seconds ? format(new Date(user.createdAt._seconds * 1000), "PPP") : 'Unknown'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={fetchActivities}
                        disabled={loadingActivities}
                        className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-zinc-800 transition disabled:opacity-50"
                    >
                        {loadingActivities ? "LOADING..." : "VIEW ACTIVITY LOGS"}
                    </button>
                    <button
                        onClick={handleSuspend}
                        disabled={suspending}
                        className="flex-1 py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] tracking-widest hover:bg-red-600/20 transition disabled:opacity-50"
                    >
                        {suspending ? "SUSPENDING..." : "LIMIT ACCESS"}
                    </button>
                </div>

                {showActivities && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <h4 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Activity History</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {activities.length === 0 ? (
                                <p className="text-zinc-600 text-xs">No activity found</p>
                            ) : (
                                activities.map((activity, idx) => (
                                    <div key={idx} className="p-3 bg-zinc-900 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{activity.type}</span>
                                            <span className="text-[9px] text-zinc-600 font-mono">
                                                {activity.createdAt?._seconds ? format(new Date(activity.createdAt._seconds * 1000), "PPp") : "Unknown"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400">{activity.title || activity.topic || "Activity"}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function AdminPortal() {
    const [activeTab, setActiveTab] = useState<"approvals" | "safety" | "logs" | "broadcast" | "users">("approvals");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState({ title: "", content: "", type: "info" });
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // User Management State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const fetchData = async () => {
        try {
            const data = await getAdminDashboardStats();
            setStats(data);
        } catch (error) {
            console.error("Error fetching admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (searchQuery.length < 2) return;
        setSearching(true);
        try {
            const { users } = await searchUsers(searchQuery);
            setSearchResults(users);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setSearching(false);
        }
    };

    const handlePromote = async (uid: string) => {
        if (!confirm("Are you sure you want to promote this user to ADMIN? This grants full control over the platform.")) return;
        setResolving(uid);
        try {
            await promoteToAdmin(uid, "default");
            alert("User promoted to Admin successfully!");
            handleSearch();
        } catch (error) {
            alert("Promotion failed.");
        } finally {
            setResolving(null);
        }
    };

    const handleApprove = async (uid: string, tenantId: string) => {
        setResolving(uid);
        try {
            await approveAlumni(uid, tenantId);
            await fetchData();
        } catch (error) {
            alert("Approval failed.");
        } finally {
            setResolving(null);
        }
    };

    const handleResolveReport = async (reportId: string, action: "none" | "warning" | "suspend") => {
        setResolving(reportId);
        try {
            await resolveSafetyReport({
                reportId,
                resolution: "Resolved by Admin",
                action,
                tenantId: "default"
            });
            await fetchData();
        } catch (error) {
            alert("Resolution failed.");
        } finally {
            setResolving(null);
        }
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAnnouncement({ ...announcement, tenantId: "default" });
            setAnnouncement({ title: "", content: "", type: "info" });
            alert("Announcement broadcasted!");
            await fetchData();
        } catch (error) {
            alert("Broadcast failed.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-24">
            <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-12">
            <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />

            <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/10 p-2 overflow-hidden flex items-center justify-center">
                        <img src="/logo.jpeg" alt="Code Wizards Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white mb-1 italic tracking-tighter uppercase leading-none">ADMIN CONTROL</h1>
                        <p className="text-zinc-500 text-[10px] font-black tracking-[0.2em] uppercase">Governance Terminal | Code Wizards</p>
                    </div>
                </div>

                <nav className="flex bg-zinc-950 p-1.5 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
                    {[
                        { id: "approvals", icon: IdentificationIcon, label: "APPROVALS" },
                        { id: "safety", icon: ShieldExclamationIcon, label: "SAFETY" },
                        { id: "users", icon: UsersIcon, label: "USERS" },
                        { id: "logs", icon: Bars3CenterLeftIcon, label: "AUDIT" },
                        { id: "broadcast", icon: MegaphoneIcon, label: "BROADCAST" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition text-[10px] font-black tracking-widest whitespace-nowrap ${activeTab === tab.id
                                ? "bg-white text-black"
                                : "text-zinc-500 hover:text-white"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>

            {loading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader variant="code" size="lg" text="Loading admin dashboard..." />
                </div>
            ) : !stats ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Failed to load admin data</p>
                </div>
            ) : (
                <main className="min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {activeTab === "approvals" && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-4">
                                    <IdentificationIcon className="w-6 h-6 text-emerald-500" />
                                    Pending Alumni Transitions
                                </h2>
                                <span className="px-4 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                    {stats.pendingAlumni?.length || 0} Applications
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {!stats.pendingAlumni || stats.pendingAlumni.length === 0 ? (
                                    <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem]">
                                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Clear of pending approvals</p>
                                    </div>
                                ) : stats.pendingAlumni.map((user: any) => (
                                    <div key={user.id} className="p-8 rounded-[2.5rem] bg-zinc-950 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-white/10 transition duration-500">
                                        <div className="flex items-center gap-6 cursor-pointer" onClick={() => setSelectedUser(user)}>
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all duration-500">
                                                <span className="text-2xl font-black text-zinc-400 capitalize">{user.displayName?.[0] || "U"}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-black text-lg group-hover:text-emerald-400 transition">{user.displayName}</h3>
                                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="px-6 py-3 border border-white/5 text-zinc-400 hover:text-white rounded-xl font-black text-[10px] transition"
                                            >
                                                INSPECT
                                            </button>
                                            <button
                                                disabled={resolving === user.id}
                                                onClick={() => handleApprove(user.id, user.tenantId || "default")}
                                                className="px-8 py-3 bg-white text-black font-black text-[10px] tracking-widest rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
                                            >
                                                {resolving === user.id ? "PROCESSING..." : "APPROVE"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="space-y-12">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-4">
                                    <UsersIcon className="w-6 h-6 text-cyan-500" />
                                    Community Directory
                                </h2>

                                <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by exact email..."
                                        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-12 py-4 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white/30 transition group-hover:border-white/20"
                                    />
                                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition" />
                                    <button type="submit" className="hidden">Search</button>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {searching ? (
                                    <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem]">
                                        <div className="w-10 h-10 border-2 border-white/5 border-t-white rounded-full animate-spin mx-auto mb-6" />
                                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Querying Encrypted Records</p>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem]">
                                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] italic">Access user records via secure search</p>
                                    </div>
                                ) : searchResults.map((user: any) => (
                                    <div key={user.uid} className="p-8 rounded-[3rem] bg-zinc-950 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-zinc-900/50 transition duration-500">
                                        <div className="flex items-center gap-6 cursor-pointer" onClick={() => setSelectedUser(user)}>
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-800 flex items-center justify-center font-black text-xl text-zinc-500 border border-white/5">
                                                {user.displayName?.[0] || "?"}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-white font-black text-lg">{user.displayName}</h3>
                                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border ${user.role === 'admin' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-900 text-zinc-500 border-white/5'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-600 text-xs font-mono">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setSelectedUser(user)} className="px-6 py-3 border border-white/5 text-zinc-400 hover:text-white rounded-xl font-black text-[10px] transition">INSPECT PROFILE</button>
                                            {user.role !== 'admin' ? (
                                                <button
                                                    disabled={resolving === user.uid}
                                                    onClick={() => handlePromote(user.uid)}
                                                    className="px-6 py-3 bg-emerald-600 text-white font-black text-[10px] rounded-xl hover:bg-emerald-500 transition shadow-xl shadow-emerald-900/40 uppercase tracking-widest"
                                                >
                                                    PROMOTE
                                                </button>
                                            ) : (
                                                <div className="px-6 py-3 bg-zinc-900 text-emerald-500 font-black text-[10px] rounded-xl border border-emerald-500/20">
                                                    AUTHORITY CONFIRMED
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "safety" && (
                        <div className="space-y-8">
                            <h2 className="text-xl font-bold text-white flex items-center gap-4">
                                <ShieldExclamationIcon className="w-6 h-6 text-orange-500" />
                                Active Safety Reports
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                {!stats.pendingReports || stats.pendingReports.length === 0 ? (
                                    <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem]">
                                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No active reports found</p>
                                    </div>
                                ) : stats.pendingReports.map((report: any) => (
                                    <div key={report.id} className="p-8 rounded-[3rem] bg-zinc-950 border border-orange-500/10 flex flex-col md:flex-row items-center justify-between gap-8 group">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-4">
                                                <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black rounded-full tracking-widest border border-orange-500/20">URGENT REPORT</span>
                                                <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest italic">{report.createdAt?.seconds ? format(new Date(report.createdAt.seconds * 1000), "MMM d, HH:mm") : 'Unknown'}</span>
                                            </div>
                                            <h3 className="text-white font-bold text-lg">{report.reason}</h3>
                                            <div className="flex items-center gap-3">
                                                <p className="text-zinc-500 text-xs">Target: <span className="font-mono text-zinc-400">{report.studentId}</span></p>
                                                <button className="text-[10px] font-black text-white hover:underline underline-offset-4">LINKED ACTIVITY</button>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleResolveReport(report.id, "none")}
                                                className="px-6 py-3 bg-zinc-900 text-white font-black text-[10px] rounded-xl hover:bg-zinc-800 transition"
                                            >
                                                DISMISS
                                            </button>
                                            <button
                                                onClick={() => handleResolveReport(report.id, "suspend")}
                                                className="px-8 py-3 bg-red-600 text-white font-black text-[10px] rounded-xl hover:bg-red-500 transition shadow-2xl shadow-red-900/50 uppercase tracking-widest"
                                            >
                                                SUSPEND USER
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "logs" && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-4">
                                    <DocumentMagnifyingGlassIcon className="w-6 h-6 text-zinc-400" />
                                    System Audit Trail
                                </h2>
                                <button className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest">Download .JSON</button>
                            </div>

                            <div className="bg-zinc-950 border border-white/5 rounded-[3.5rem] overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-white/10 uppercase text-[10px] font-black tracking-widest text-zinc-600">
                                        <tr>
                                            <th className="px-10 py-6">Timestamp</th>
                                            <th className="px-10 py-6">Action Interface</th>
                                            <th className="px-10 py-6">Primary Actor</th>
                                            <th className="px-10 py-6">Target Resource</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {stats.recentLogs?.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-white/5 transition text-zinc-500 group">
                                                <td className="px-10 py-5 font-mono text-[10px]">{log.timestamp?.seconds ? format(new Date(log.timestamp.seconds * 1000), "HH:mm:ss dd/MM") : 'Unknown'}</td>
                                                <td className="px-10 py-5">
                                                    <span className="text-zinc-300 font-bold group-hover:text-emerald-400 transition">{log.action || log.type}</span>
                                                </td>
                                                <td className="px-10 py-5 font-mono text-[10px] text-zinc-600">{log.actorId || log.uid}</td>
                                                <td className="px-10 py-5 font-mono text-[10px] text-zinc-600">{log.targetId || "SYSTEM"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "broadcast" && (
                        <div className="max-w-4xl mx-auto py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="text-center md:text-left space-y-4">
                                    <MegaphoneIcon className="w-16 h-16 text-white" />
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Broadcast</h2>
                                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">System-Wide Notifications</p>
                                </div>

                                <form onSubmit={handleCreateAnnouncement} className="space-y-6 p-10 bg-zinc-950 border border-white/10 rounded-[3.5rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition duration-1000" />

                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Message Header</label>
                                        <input
                                            required
                                            value={announcement.title}
                                            onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                                            placeholder="ALERTI: Important Title..."
                                        />
                                    </div>

                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Transmission Mode</label>
                                        <select
                                            value={announcement.type}
                                            onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs focus:outline-none appearance-none"
                                        >
                                            <option value="info">GENERAL PULSE</option>
                                            <option value="warning">CRITICAL VECTOR</option>
                                            <option value="success">ACHIEVEMENT UNLOCKED</option>
                                            <option value="event">GLOBAL EVENT</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Payload Content</label>
                                        <textarea
                                            required
                                            value={announcement.content}
                                            onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white/20 h-32 resize-none"
                                            placeholder="Enter the message body to be transmitted to all nodes..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition active:scale-95 text-[10px] tracking-[0.2em] uppercase relative overflow-hidden"
                                    >
                                        INITIATE BROADCAST
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <ClockIcon className="w-6 h-6 text-zinc-500" />
                                    Transmission History
                                </h3>

                                <div className="space-y-4">
                                    {!stats.announcements || stats.announcements.length === 0 ? (
                                        <div className="p-12 text-center rounded-[2.5rem] border border-white/5 border-dashed">
                                            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">No previous broadcasts recorded</p>
                                        </div>
                                    ) : (
                                        stats.announcements.map((ann: any) => (
                                            <div key={ann.id} className="p-6 bg-zinc-950 border border-white/5 rounded-3xl hover:border-white/10 transition group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-bold text-white group-hover:text-blue-400 transition">{ann.title}</h4>
                                                    <span className="text-[8px] font-black px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 uppercase">{ann.type}</span>
                                                </div>
                                                <p className="text-xs text-zinc-600 mb-4 line-clamp-2">{ann.content}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                                                        {ann.createdAt?._seconds ? new Date(ann.createdAt._seconds * 1000).toLocaleDateString() : 'Unknown'}
                                                    </span>
                                                    <button className="text-[8px] font-black text-red-900 hover:text-red-500 transition uppercase tracking-widest">REMOVE RECORD</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            )}
        </div>
    );
}
