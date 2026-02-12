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
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="mb-4">Welcome, {user.email}</p>
            <div className="bg-gray-100 p-4 rounded mb-6">
                <p><strong>UID:</strong> {user.uid}</p>
                <p><strong>Role:</strong> {role || "No role assigned"}</p>
            </div>

            <div className="space-y-4">
                {!role && (
                    <div className="border p-4 border-yellow-400 bg-yellow-50 rounded">
                        <h2 className="font-bold text-yellow-800">Action Required</h2>
                        <p>You have not registered heavily yet.</p>
                        <div className="mt-2 space-x-4">
                            <a href="/auth/register-student" className="text-blue-600 underline">Register as Student</a>
                            <span className="text-gray-400">|</span>
                            <a href="/auth/register-alumni" className="text-blue-600 underline">Register as Alumni</a>
                        </div>
                    </div>
                )}

                {role === "admin" && (
                    <div className="border p-4 border-red-400 bg-red-50 rounded">
                        <h2 className="font-bold text-red-800">Admin Controls</h2>
                        <button className="bg-red-600 text-white px-3 py-1 rounded">Manage Users</button>
                    </div>
                )}
            </div>

            <button
                onClick={() => auth.signOut()}
                className="mt-8 text-gray-600 hover:text-black"
            >
                Sign Out
            </button>
        </div>
    );
}
