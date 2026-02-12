"use client";

import { format } from "date-fns";
import {
    ChatBubbleLeftRightIcon,
    PencilSquareIcon,
    UserGroupIcon,
    ClockIcon
} from "@heroicons/react/24/outline";

interface ActivityItem {
    id: string;
    type: "POST" | "GUIDANCE_REQUESTED" | "GUIDANCE_JOINED";
    title?: string;
    topic?: string;
    status?: string;
    createdAt: { seconds: number; nanoseconds: number };
}

export default function ActivityHistory({ activities }: { activities: ActivityItem[] }) {
    if (activities.length === 0) {
        return (
            <div className="p-12 text-center rounded-[3rem] border border-white/5 bg-zinc-950/30">
                <p className="text-zinc-500 font-medium">No activity recorded yet. Start contributing!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <ClockIcon className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Contribution History</h3>
                    <p className="text-zinc-500 text-xs">Your journey in the community</p>
                </div>
            </div>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                {activities.map((item, idx) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        {/* Dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-zinc-950 text-white shadow shadow-zinc-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors group-hover:border-zinc-500 z-10">
                            {item.type === "POST" && <PencilSquareIcon className="w-5 h-5" />}
                            {item.type === "GUIDANCE_REQUESTED" && <ChatBubbleLeftRightIcon className="w-5 h-5" />}
                            {item.type === "GUIDANCE_JOINED" && <UserGroupIcon className="w-5 h-5" />}
                        </div>

                        {/* Content */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5 hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-2">
                                <time className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                    {item.createdAt && typeof item.createdAt.seconds === 'number'
                                        ? format(new Date(item.createdAt.seconds * 1000), "MMM d, yyyy")
                                        : "Recent"}
                                </time>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-zinc-400 uppercase tracking-tighter">
                                    {item.type.replace("_", " ")}
                                </span>
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1">{item.title || item.topic}</h4>
                            {item.status && (
                                <p className="text-zinc-500 text-xs flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {item.status}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
