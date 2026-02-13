"use client";

import { useState } from "react";
import { createPost } from "@/services/api";

interface CreatePostProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function CreatePost({ onSuccess, onCancel }: CreatePostProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagsInput, setTagsInput] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const tags = tagsInput.split(",").map(t => t.trim()).filter(t => t !== "");

        try {
            await createPost({
                title,
                content,
                tags,
                tenantId: "default"
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to create post. Check your rate limits.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-xl p-8 rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">SHARE AN INSIGHT</h2>
                <button onClick={onCancel} className="text-zinc-500 hover:text-white transition text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 ml-1">Title</label>
                    <input
                        required
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition font-medium"
                        placeholder="What's on your mind?"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 ml-1">Content</label>
                    <textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition resize-none h-40 text-sm leading-relaxed"
                        placeholder="Describe your project, question, or achievement..."
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 ml-1">Tags (comma separated)</label>
                    <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition text-sm"
                        placeholder="e.g. react, careers, firebase"
                    />
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-white/5 transition"
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 transition flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="h-4 w-4 border-2 border-zinc-400 border-t-black rounded-full animate-spin" />
                        ) : "POST TO COMMUNITY"}
                    </button>
                </div>
            </form>
        </div>
    );
}
