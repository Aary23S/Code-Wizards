"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { likePost, commentPost } from "@/services/api";

interface PostCardProps {
    post: {
        id: string;
        title: string;
        content: string;
        tags: string[];
        authorId: string;
        authorName?: string;
        createdAt: any;
        likes: number;
        commentsCount: number;
    };
    onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
    const date = post.createdAt?.toDate ? post.createdAt.toDate() : new Date();
    const [liking, setLiking] = useState(false);
    const [commenting, setCommenting] = useState(false);
    const [showCommentBox, setShowCommentBox] = useState(false);
    const [commentText, setCommentText] = useState("");

    const handleLike = async () => {
        setLiking(true);
        try {
            await likePost({ postId: post.id });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Like failed:", error);
        } finally {
            setLiking(false);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setCommenting(true);
        try {
            await commentPost({ postId: post.id, content: commentText });
            setCommentText("");
            setShowCommentBox(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Comment failed:", error);
        } finally {
            setCommenting(false);
        }
    };

    return (
        <div className="group p-6 rounded-2xl bg-zinc-900 border border-white/5 hover:border-white/10 transition shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {(post.authorName || "U").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-white">{post.authorName || "Anonymous Wizard"}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                            {formatDistanceToNow(date)} ago
                        </div>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    {post.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-zinc-400">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            <h3 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-white transition">
                {post.title}
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3">
                {post.content}
            </p>

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <button
                    onClick={handleLike}
                    disabled={liking}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition group/btn disabled:opacity-50"
                >
                    <span className="text-lg group-hover/btn:scale-110 transition">♥</span>
                    <span className="text-xs font-medium">{post.likes}</span>
                </button>
                <button
                    onClick={() => setShowCommentBox(!showCommentBox)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition group/btn"
                >
                    <span className="text-lg group-hover/btn:scale-110 transition">💬</span>
                    <span className="text-xs font-medium">{post.commentsCount}</span>
                </button>
                <button className="ml-auto text-zinc-500 hover:text-white transition">
                    <span className="text-lg">🔖</span>
                </button>
            </div>

            {showCommentBox && (
                <form onSubmit={handleComment} className="mt-4 pt-4 border-t border-white/5">
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="w-full bg-zinc-800 border border-white/5 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition resize-none h-20"
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => setShowCommentBox(false)}
                            className="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={commenting || !commentText.trim()}
                            className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition disabled:opacity-50"
                        >
                            {commenting ? "Posting..." : "Post Comment"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
