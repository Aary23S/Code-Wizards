"use client";

import { useEffect, useState } from "react";
import { getPosts } from "@/services/api";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";

export default function PostFeed() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const data: any = await getPosts({});
            setPosts(data.posts || []);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">COMMUNITY FEED</h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Insights, updates, and discussions from the Code Wizard club</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-zinc-200 transition shadow-lg shadow-white/5"
                >
                    + SHARE INSIGHT
                </button>
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 overflow-y-auto">
                    <CreatePost
                        onSuccess={() => { setShowCreate(false); fetchPosts(); }}
                        onCancel={() => setShowCreate(false)}
                    />
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 rounded-2xl bg-zinc-900 border border-white/5" />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="py-20 text-center rounded-3xl bg-zinc-950 border border-white/5 border-dashed">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-xl font-black text-zinc-300 mb-2 uppercase tracking-widest">NO POSTS YET</h3>
                    <p className="text-zinc-500 mb-6 text-xs uppercase tracking-wider">Be the first to share something with the community</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-6 py-3 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition"
                    >
                        START A DISCUSSION
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
                    ))}
                </div>
            )}
        </div>
    );
}
