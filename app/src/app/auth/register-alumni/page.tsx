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
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Alumni Registration</h1>

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
                    <label className="block text-sm font-medium mb-1">Current Company</label>
                    <input
                        type="text"
                        required
                        className="w-full border p-2 rounded"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Current Role / Job Title</label>
                    <input
                        type="text"
                        required
                        className="w-full border p-2 rounded"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
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

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={formData.mentorOptIn}
                        onChange={e => setFormData({ ...formData, mentorOptIn: e.target.checked })}
                    />
                    <label>I am willing to mentor students</label>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={formData.referralOptIn}
                        onChange={e => setFormData({ ...formData, referralOptIn: e.target.checked })}
                    />
                    <label>I can provide referrals</label>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {submitting ? "Submitting..." : "Submit Application"}
                </button>
            </form>
        </div>
    );
}
