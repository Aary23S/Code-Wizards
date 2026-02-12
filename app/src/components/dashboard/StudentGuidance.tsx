"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/services/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

export default function StudentGuidance() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "guidanceRequests"),
            where("studentId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return (
            <div className="p-8 bg-zinc-950 border border-white/5 rounded-[3rem]">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-zinc-900 rounded w-1/3" />
                    <div className="h-20 bg-zinc-900 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-zinc-950 border border-white/5 rounded-[3rem] space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-widest italic">MY GUIDANCE REQUESTS</h3>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-zinc-500 tracking-widest uppercase">
                    {requests.length} TOTAL
                </span>
            </div>

            <div className="space-y-4">
                {requests.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl">
                        <p className="text-zinc-600 text-sm uppercase tracking-wider">No guidance requests yet</p>
                        <p className="text-zinc-700 text-xs mt-1 uppercase tracking-wider">Request mentorship or referrals to get started</p>
                    </div>
                ) : (
                    requests.map((req) => {
                        const date = req.createdAt?.toDate ? req.createdAt.toDate() : new Date();
                        const statusColor =
                            req.status === "completed" ? "text-emerald-500" :
                                req.status === "accepted" ? "text-blue-500" :
                                    req.status === "pending" ? "text-yellow-500" :
                                        "text-zinc-500";

                        return (
                            <div key={req.id} className="p-6 bg-zinc-900 border border-white/5 rounded-2xl hover:border-white/10 transition group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-white font-bold">{req.topic}</h4>
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                                            {formatDistanceToNow(date)} ago
                                        </p>
                                    </div>
                                </div>

                                <p className="text-zinc-400 text-sm mb-4">{req.message}</p>

                                {req.mentorId && (
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Assigned Mentor</p>
                                        <p className="text-zinc-400 text-xs font-mono">{req.mentorId}</p>
                                    </div>
                                )}

                                {req.response && (
                                    <div className="mt-4 p-4 bg-zinc-950 border border-white/5 rounded-xl">
                                        <p className="text-[10px] text-emerald-500 uppercase tracking-widest mb-2 font-black">Alumni Response</p>
                                        <p className="text-zinc-300 text-sm">{req.response}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
