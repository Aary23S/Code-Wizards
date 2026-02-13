"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/services/auth";
import { getProfile, updateProfile, getActivityHistory, transitionToAlumni } from "@/services/api";
import { useRouter } from "next/navigation";
import ActivityHistory from "@/components/profile/ActivityHistory";
import {
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    UserIcon,
    AcademicCapIcon,
    CameraIcon,
    BriefcaseIcon
} from "@heroicons/react/24/outline";
import Loader from "@/components/common/Loader";

export default function ProfilePage() {
    const { user, loading: authLoading, role } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);
    const [showTransition, setShowTransition] = useState(false);
    const [transitionData, setTransitionData] = useState({
        company: "",
        role: "",
        gradYear: new Date().getFullYear(),
        expertise: [] as string[],
        bio: "",
        socialLinks: { linkedin: "" }
    });
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const data = await getActivityHistory();
            setActivities(data);
        } catch (error) {
            console.error("Error fetching activity history:", error);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
            return;
        }

        if (user) {
            fetchData();
            fetchHistory();
        }
    }, [user, authLoading, router]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await updateProfile(profile);
            setIsEditing(false);
            await fetchData(); // Re-fetch profile to ensure latest data
        } catch (err: any) {
            setError(err.message || "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleTransition = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await transitionToAlumni({
                ...transitionData,
                tenantId: profile.tenantId || "default"
            });
            setShowTransition(false);
            alert("Graduation request submitted! Awaiting admin approval.");
            window.location.reload();
        } catch (error) {
            console.error("Error transitioning:", error);
            setError("Failed to submit graduation request.");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return <Loader variant="spinner" size="lg" fullScreen={true} text="Loading your profile..." />;
    }

    if (!profile) return null;

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
                            <span className="text-[9px] font-bold tracking-[0.3em] text-zinc-500 uppercase">Profile Center</span>
                        </div>
                    </div>
                    <button onClick={() => router.push("/")} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition">BACK TO HOME</button>
                </div>
            </nav>

            <main className="pt-32 px-6 max-w-4xl mx-auto">
                {/* Transition Modal */}
                {showTransition && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 overflow-y-auto">
                        <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[3rem] p-8 md:p-12 space-y-8 shadow-2xl my-auto">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2 italic tracking-tighter uppercase">GRADUATE TO ALUMNI</h3>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Update your professional details to join the Alumni network</p>
                                </div>
                                <button onClick={() => setShowTransition(false)} className="p-2 text-zinc-500 hover:text-white transition">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleTransition} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Current Company</label>
                                    <input
                                        required
                                        value={transitionData.company}
                                        onChange={(e) => setTransitionData({ ...transitionData, company: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                        placeholder="Google, Microsoft, etc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Your Role</label>
                                    <input
                                        required
                                        value={transitionData.role}
                                        onChange={(e) => setTransitionData({ ...transitionData, role: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                        placeholder="Software Engineer, PM, etc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Graduation Year</label>
                                    <input
                                        required
                                        type="number"
                                        value={transitionData.gradYear}
                                        onChange={(e) => setTransitionData({ ...transitionData, gradYear: parseInt(e.target.value) })}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Expertise (comma separated)</label>
                                    <input
                                        required
                                        placeholder="React, Backend, Figma..."
                                        value={transitionData.expertise.join(", ")}
                                        onChange={(e) => setTransitionData({ ...transitionData, expertise: e.target.value.split(",").map(s => s.trim()) })}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">New Professional Bio</label>
                                    <textarea
                                        required
                                        value={transitionData.bio}
                                        onChange={(e) => setTransitionData({ ...transitionData, bio: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 h-24 resize-none"
                                        placeholder="Briefly describe your career path..."
                                    />
                                </div>
                                <div className="md:col-span-2 flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50"
                                    >
                                        {saving ? "PROCESSING..." : "SUBMIT GRADUATION REQUEST"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-12">
                    {/* Left: Avatar & Basic Info */}
                    <aside className="w-full md:w-1/3 flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="h-40 w-40 rounded-full bg-zinc-900 border-4 border-white/5 overflow-hidden ring-4 ring-white/0 group-hover:ring-white/10 transition-all">
                                {profile.profilePicUrl ? (
                                    <img src={profile.profilePicUrl} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-zinc-700">
                                        {profile.displayName?.charAt(0) || "U"}
                                    </div>
                                )}
                            </div>
                            {isEditing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                    <span className="text-xs font-bold uppercase tracking-widest">Change Pic</span>
                                </div>
                            )}
                        </div>

                        <h1 className="mt-6 text-2xl font-bold tracking-tight">{profile.displayName}</h1>
                        <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-semibold">{role || "User"}</p>

                        <div className="mt-8 w-full space-y-2">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition"
                                >
                                    EDIT PROFILE
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full py-3 bg-zinc-100 text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition flex items-center justify-center gap-2"
                                    >
                                        {saving ? "SAVING..." : "SAVE CHANGES"}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="w-full py-3 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:bg-white/5 transition"
                                    >
                                        CANCEL
                                    </button>
                                </>
                            )}
                        </div>
                    </aside>

                    {/* Right: Detailed Fields */}
                    <section className="flex-1 space-y-12">
                        {/* Section: Academic/Professional */}
                        <div className="p-8 rounded-3xl bg-zinc-950 border border-white/5">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-8">Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <ProfileItem label="Email" value={profile.email} isEditing={isEditing} field="email" onChange={(v) => setProfile({ ...profile, email: v })} />
                                {role === 'student' && (
                                    <>
                                        <ProfileItem label="Branch" value={profile.branch} isEditing={isEditing} field="branch" onChange={(v) => setProfile({ ...profile, branch: v })} />
                                        <ProfileItem label="Division" value={profile.division} isEditing={isEditing} field="division" onChange={(v) => setProfile({ ...profile, division: v })} />
                                        <ProfileItem label="Roll No" value={profile.rollNo} isEditing={isEditing} field="rollNo" onChange={(v) => setProfile({ ...profile, rollNo: v })} />
                                        <ProfileItem label="PRN" value={profile.prnNo} isEditing={isEditing} field="prnNo" onChange={(v) => setProfile({ ...profile, prnNo: v })} />
                                    </>
                                )}
                                {role === 'alumni' && (
                                    <>
                                        <ProfileItem label="Graduation Year" value={profile.gradYear?.toString()} isEditing={isEditing} field="gradYear" onChange={(v) => setProfile({ ...profile, gradYear: parseInt(v) || 0 })} />
                                        <ProfileItem label="Expertise" value={Array.isArray(profile.expertise) ? profile.expertise.join(", ") : profile.expertise} isEditing={isEditing} field="expertise" onChange={(v) => setProfile({ ...profile, expertise: v.split(",").map(i => i.trim()) })} />
                                        <ProfileItem label="Company" value={profile.company} isEditing={isEditing} field="company" onChange={(v) => setProfile({ ...profile, company: v })} />
                                        <ProfileItem label="Role" value={profile.role} isEditing={isEditing} field="role" onChange={(v) => setProfile({ ...profile, role: v })} />
                                    </>
                                )}
                                <ProfileItem label="Bio" value={profile.bio} isEditing={isEditing} field="bio" type="textarea" onChange={(v) => setProfile({ ...profile, bio: v })} />
                                <ProfileItem label="Address" value={profile.address} isEditing={isEditing} field="address" onChange={(v) => setProfile({ ...profile, address: v })} />
                            </div>

                            {role === 'alumni' && (
                                <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                                    <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Service & Privacy</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Engagements</span>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={profile.mentorOptIn ?? false}
                                                    disabled={!isEditing}
                                                    onChange={(e) => setProfile({ ...profile, mentorOptIn: e.target.checked })}
                                                    className="w-4 h-4 rounded bg-zinc-900 border-white/10 accent-white disabled:opacity-50"
                                                />
                                                <span className="text-sm text-zinc-400 group-hover:text-white transition">Accepting Mentorship</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={profile.referralOptIn ?? false}
                                                    disabled={!isEditing}
                                                    onChange={(e) => setProfile({ ...profile, referralOptIn: e.target.checked })}
                                                    className="w-4 h-4 rounded bg-zinc-900 border-white/10 accent-white disabled:opacity-50"
                                                />
                                                <span className="text-sm text-zinc-400 group-hover:text-white transition">Accepting Referrals</span>
                                            </label>
                                        </div>

                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Visibility Settings</span>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={profile.privacySettings?.showEmail ?? false}
                                                    disabled={!isEditing}
                                                    onChange={(e) => setProfile({ ...profile, privacySettings: { ...profile.privacySettings, showEmail: e.target.checked } })}
                                                    className="w-4 h-4 rounded bg-zinc-900 border-white/10 accent-white disabled:opacity-50"
                                                />
                                                <span className="text-sm text-zinc-400 group-hover:text-white transition">Show Email to Students</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={profile.privacySettings?.showLinkedIn ?? true}
                                                    disabled={!isEditing}
                                                    onChange={(e) => setProfile({ ...profile, privacySettings: { ...profile.privacySettings, showLinkedIn: e.target.checked } })}
                                                    className="w-4 h-4 rounded bg-zinc-900 border-white/10 accent-white disabled:opacity-50"
                                                />
                                                <span className="text-sm text-zinc-400 group-hover:text-white transition">Show LinkedIn Link</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section: Links */}
                        <div className="p-8 rounded-3xl bg-zinc-950 border border-white/5">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-8">Links & Portfolios</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <ProfileItem label="GitHub" value={profile.socialLinks?.github} isEditing={isEditing} field="github" onChange={(v) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, github: v } })} />
                                <ProfileItem label="LinkedIn" value={profile.socialLinks?.linkedin} isEditing={isEditing} field="linkedin" onChange={(v) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, linkedin: v } })} />
                                <ProfileItem label="LeetCode" value={profile.codingProfiles?.leetcode} isEditing={isEditing} field="leetcode" onChange={(v) => setProfile({ ...profile, codingProfiles: { ...profile.codingProfiles, leetcode: v } })} />
                                <ProfileItem label="Resume URL" value={profile.resumeUrl} isEditing={isEditing} field="resumeUrl" onChange={(v) => setProfile({ ...profile, resumeUrl: v })} />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {role === 'student' && (
                            <div className="p-8 md:p-12 rounded-[3.5rem] bg-zinc-950 border border-white/5 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/10 transition duration-1000" />
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="max-w-xl text-center md:text-left">
                                        <h3 className="text-3xl font-black text-white mb-3">Ready to give back?</h3>
                                        <p className="text-zinc-500 leading-relaxed font-medium">If you have graduated, transition to an Alumni role to mentor juniors, provide referrals, and contribute to the community in a new way.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowTransition(true)}
                                        className="px-10 py-5 bg-white text-black font-black rounded-[2rem] hover:scale-105 transition active:scale-95 whitespace-nowrap"
                                    >
                                        GRADUATE TO ALUMNI
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="p-12 rounded-[3.5rem] bg-zinc-950/50 border border-white/5">
                            <ActivityHistory activities={activities} />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

function ProfileItem({ label, value, isEditing, field, onChange, type = "text" }: { label: string, value: string, isEditing: boolean, field: string, onChange: (v: string) => void, type?: string }) {
    return (
        <div className="space-y-2">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{label}</span>
            {isEditing ? (
                type === "textarea" ? (
                    <textarea
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition h-24"
                    />
                ) : (
                    <input
                        type="text"
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
                    />
                )
            ) : (
                <div className="text-sm text-zinc-300 font-medium">
                    {value || <span className="text-zinc-700 italic">Not set</span>}
                    {value && (field === 'github' || field === 'linkedin' || field === 'leetcode' || field === 'resumeUrl') && (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="ml-2 text-zinc-600 hover:text-white transition">↗</a>
                    )}
                </div>
            )}
        </div>
    );
}
