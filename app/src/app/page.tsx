"use client";

import { useAuth, signInWithGoogle, logout } from "@/services/auth";
import { bootstrapAdmin } from "@/services/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import StudentRegistration from "@/components/registration/StudentRegistration";
import AlumniRegistration from "@/components/registration/AlumniRegistration";
import PostFeed from "@/components/community/PostFeed";
import ClubActivities from "@/components/community/ClubActivities";
import AlumniDashboard from "@/components/alumni/AlumniDashboard";

export default function Home() {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const [showReg, setShowReg] = useState<"student" | "alumni" | null>(null);
  const [view, setView] = useState<"landing" | "dashboard">("landing");

  const [isSigningIn, setIsSigningIn] = useState(false);

  // Automatically switch to dashboard if user has a role and we're not in a registration flow
  if (user && role && view === "landing" && !showReg) {
    setView("dashboard");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
      </div>
    );
  }

  const handleJoin = async (type: "student" | "alumni") => {
    if (!user) {
      setIsSigningIn(true);
      const success = await signInWithGoogle();
      setIsSigningIn(false);
      if (success) {
        setShowReg(type);
      }
    } else {
      setShowReg(type);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div
            onClick={() => setView("landing")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded bg-white group-hover:bg-zinc-200 transition" />
            <span className="text-xl font-bold tracking-tighter transition hover:text-zinc-400">CODE WIZARD</span>
          </div>

          <div className="flex items-center gap-6">
            {!user ? (
              <button
                disabled={isSigningIn}
                onClick={async () => {
                  setIsSigningIn(true);
                  await signInWithGoogle();
                  setIsSigningIn(false);
                }}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {isSigningIn ? "..." : "Sign In"}
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium">{user.displayName}</span>
                  {role && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-widest text-zinc-400 border border-white/5">
                      {role}
                    </span>
                  )}
                </div>

                {role && (
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm transition hover:bg-white/5 group"
                  >
                    <span>Profile</span>
                    <span className="text-zinc-500 group-hover:text-white">👤</span>
                  </button>
                )}

                {role === "admin" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-500 transition hover:bg-emerald-500/20 group"
                  >
                    <span className="font-bold">Admin</span>
                    <span className="opacity-70 group-hover:opacity-100">🛡️</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    setView("landing");
                    setShowReg(null);
                  }}
                  className="rounded-full border border-white/10 px-4 py-1.5 text-sm transition hover:bg-white/5"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="pt-20">
        {view === "dashboard" && user && role ? (
          <div className="space-y-20">
            {role === "alumni" && <AlumniDashboard />}
            <PostFeed />
            <ClubActivities mode="community" />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <main className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 pt-12 pb-20 overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-black to-black blur-3xl opacity-50" />

              <div className="text-center max-w-4xl mx-auto w-full flex flex-col items-center">
                {showReg === "student" ? (
                  <StudentRegistration
                    onSuccess={() => { setShowReg(null); window.location.reload(); }}
                    onCancel={() => setShowReg(null)}
                  />
                ) : showReg === "alumni" ? (
                  <AlumniRegistration
                    onSuccess={() => { setShowReg(null); window.location.reload(); }}
                    onCancel={() => setShowReg(null)}
                  />
                ) : (
                  <>
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-none">
                      Empowering the<br />Next Gen of Coders.
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                      The exclusive platform for our university's coding club. Connect with alumni, find mentors, and showcase your growth.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      {!role ? (
                        <>
                          <button
                            disabled={isSigningIn}
                            onClick={() => handleJoin("student")}
                            className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-200 transition disabled:opacity-50"
                          >
                            {isSigningIn ? (user ? "Loading..." : "Wait...") : "Join as Student"}
                          </button>
                          <button
                            disabled={isSigningIn}
                            onClick={() => handleJoin("alumni")}
                            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-white/10 rounded-full font-bold text-lg hover:bg-white/5 transition disabled:opacity-50"
                          >
                            Join as Alumni
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setView("dashboard")}
                          className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-200 transition group flex items-center gap-2"
                        >
                          Enter Dashboard
                          <span className="transition-transform group-hover:translate-x-1">→</span>
                        </button>
                      )}
                    </div>

                    {/* Developer Bootstrap Tool (Local Only) */}
                    {process.env.NODE_ENV === "development" && user && role !== "admin" && (
                      <div className="mt-20 p-8 rounded-3xl border border-dashed border-emerald-500/20 bg-emerald-500/5 max-w-sm">
                        <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase mb-4">FOR DEVELOPER ONLY</p>
                        <p className="text-zinc-500 text-xs mb-6 font-medium">No admin exists on this account. Click below to grant yourself administrative rights for testing.</p>
                        <button
                          onClick={async () => {
                            try {
                              await bootstrapAdmin();
                              alert("Success! You are now an Admin. Refreshing browser...");
                              window.location.reload();
                            } catch (e) {
                              alert("Bootstrap failed. Ensure your account is signed in.");
                            }
                          }}
                          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] tracking-widest hover:bg-emerald-500 transition"
                        >
                          BOOTSTRAP ADMIN ROLE 🛡️
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>

            {/* Stats/Features Preview */}
            {!showReg && (
              <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "Community", desc: "Collaborate with high-caliber peers.", icon: "👥" },
                    { label: "Mentorship", desc: "Learn from alumni in top companies.", icon: "✨" },
                    { label: "Opportunities", desc: "Exclusive jobs and project leads.", icon: "🚀" }
                  ].map((feature, i) => (
                    <div key={i} className="group p-8 rounded-3xl bg-zinc-950 border border-white/5 hover:border-white/10 transition">
                      <div className="text-3xl mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-bold mb-2">{feature.label}</h3>
                      <p className="text-zinc-500 group-hover:text-zinc-400 transition">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {!showReg && <ClubActivities mode="landing" />}
          </>
        )}
      </div>
    </div>
  );
}
