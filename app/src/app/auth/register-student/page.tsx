"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth";
import { registerStudent } from "@/services/api";

export default function RegisterStudentPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        displayName: "",
        bio: "",
        skills: "",
        year: new Date().getFullYear(),
        tenantId: "default-tenant", // MVP: Hardcoded
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (loading) return <div>Loading...</div>;
    if (!user) {
        // In a real app, redirect to login
        return <div>Please log in first.</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(Boolean);

        try {
            await registerStudent({
                ...formData,
                skills: skillsArray,
                year: Number(formData.year),
            });
            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to register.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Student Registration</h1>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Display Name</label>
                    <input
                        type="text"
                        required
                        className="w-full border p-2 rounded"
                        value={formData.displayName}
                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Graduation Year</label>
                    <input
                        type="number"
                        required
                        min="2020"
                        max="2030"
                        className="w-full border p-2 rounded"
                        value={formData.year}
                        onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Skills (comma separated)</label>
                    <input
                        type="text"
                        placeholder="React, TypeScript, Firebase"
                        className="w-full border p-2 rounded"
                        value={formData.skills}
                        onChange={e => setFormData({ ...formData, skills: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                        className="w-full border p-2 rounded"
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {submitting ? "Registering..." : "Complete Registration"}
                </button>
            </form>
        </div>
    );
}
