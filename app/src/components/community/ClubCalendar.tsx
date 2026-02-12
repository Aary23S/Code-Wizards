"use client";

import { useState } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval
} from "date-fns";

interface Event {
    date: Date;
    title: string;
    type: "event" | "holiday";
}

const MOCK_EVENTS: Event[] = [
    { date: new Date(2026, 1, 15), title: "Algo-Trade Workshop", type: "event" },
    { date: new Date(2026, 1, 26), title: "Republic Day", type: "holiday" },
    { date: new Date(2026, 2, 5), title: "Holi Festival", type: "holiday" },
    { date: new Date(2026, 2, 12), title: "Core Committee Meet", type: "event" },
    { date: new Date(2026, 2, 20), title: "Spring Hackathon", type: "event" },
];

export default function ClubCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white">
                    {format(currentMonth, "MMMM yyyy")}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-white/5 rounded-full transition text-zinc-400 hover:text-white border border-white/5"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-white/5 rounded-full transition text-zinc-400 hover:text-white border border-white/5"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-zinc-600 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                {calendarDays.map((day, idx) => {
                    const dayEvents = MOCK_EVENTS.filter(e => isSameDay(e.date, day));
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={idx}
                            className={`min-h-[100px] p-3 transition relative group ${isCurrentMonth ? "bg-black" : "bg-zinc-950/50"
                                } hover:bg-zinc-900/50`}
                        >
                            <span className={`text-sm font-medium ${!isCurrentMonth ? "text-zinc-700" : isToday ? "text-blue-400" : "text-zinc-400"
                                }`}>
                                {format(day, "d")}
                            </span>

                            <div className="mt-2 space-y-1">
                                {dayEvents.map((event, eIdx) => (
                                    <div
                                        key={eIdx}
                                        className={`text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium ${event.type === "holiday"
                                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                            }`}
                                        title={event.title}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                            </div>

                            {isToday && (
                                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-zinc-950/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            <div className="mt-8 flex items-center justify-center gap-8 text-xs font-medium text-zinc-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Club Events</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Leaves / Holidays</span>
                </div>
            </div>
        </div>
    );
}
