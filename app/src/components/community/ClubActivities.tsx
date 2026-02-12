"use client";

import ClubCalendar from "./ClubCalendar";

interface ClubEvent {
    id: string;
    title: string;
    date: string;
    description: string;
    image: string;
    category: "Technical" | "Workshop" | "Social";
}

const PAST_EVENTS: ClubEvent[] = [
    {
        id: "1",
        title: "Genesis Hackathon 2025",
        date: "Jan 12, 2025",
        description: "A 48-hour journey of building innovative solutions for real-world problems.",
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800",
        category: "Technical"
    },
    {
        id: "2",
        title: "Cloud Native Workshop",
        date: "Dec 05, 2024",
        description: "Deep dive into Docker, Kubernetes, and scalable system design with industry experts.",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
        category: "Workshop"
    }
];

const FOUNDERS = [
    {
        name: "Aryan Sharma",
        role: "President & Lead Developer",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan",
        bio: "Tech enthusiast and community builder."
    },
    {
        name: "Isha Patil",
        role: "Technical Head",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Isha",
        bio: "Full-stack engineer passionate about teaching."
    },
    {
        name: "Rohan Varma",
        role: "Operations Manager",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",
        bio: "Turning ideas into organized club events."
    }
];

interface ClubActivitiesProps {
    mode: "landing" | "community";
}

export default function ClubActivities({ mode }: ClubActivitiesProps) {
    return (
        <section className={`w-full max-w-7xl mx-auto py-24 px-6 ${mode === "landing" ? "space-y-32" : "space-y-16"}`}>
            {/* Header Section - Always show on landing, maybe different on community */}
            {mode === "landing" && (
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-5xl font-extrabold text-white tracking-tight">
                        Club Activities & <span className="text-blue-500">Milestones</span>
                    </h2>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Explore our journey, upcoming schedules, and the team driving the code revolution at our university.
                    </p>
                </div>
            )}

            {/* Grid layout changes based on mode */}
            <div className={`grid grid-cols-1 ${mode === "landing" ? "xl:grid-cols-1" : "xl:grid-cols-2"} gap-16 items-start`}>

                {/* Events Section - Show Past on Landing, maybe something else later */}
                {(mode === "landing" || mode === "community") && (
                    <div className="space-y-12">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-bold text-white">
                                {mode === "landing" ? "Featured Events" : "Upcoming Events"}
                            </h3>
                            <p className="text-zinc-500">
                                {mode === "landing" ? "From midnight coffee to production-ready code." : "Sync your schedule with our latest workshops."}
                            </p>
                        </div>

                        <div className={`grid grid-cols-1 ${mode === "landing" ? "md:grid-cols-2" : "md:grid-cols-1"} gap-8`}>
                            {PAST_EVENTS.map((event) => (
                                <div
                                    key={event.id}
                                    className="group relative bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all duration-500"
                                >
                                    <div className="aspect-[16/9] overflow-hidden">
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                        />
                                    </div>
                                    <div className="p-8 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
                                                {event.category}
                                            </span>
                                            <span className="text-xs text-zinc-500 font-medium">{event.date}</span>
                                        </div>
                                        <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {event.title}
                                        </h4>
                                        <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
                                            {event.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Calendar Section - ONLY on community page */}
                {mode === "community" && (
                    <div className="space-y-12">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-bold text-white">Annual Calendar</h3>
                            <p className="text-zinc-500">Keep track of hackathons, exams, and holidays.</p>
                        </div>
                        <ClubCalendar />
                    </div>
                )}
            </div>

            {/* Founders Section - ONLY on landing page */}
            {mode === "landing" && (
                <div className="space-y-16">
                    <div className="text-center space-y-4">
                        <h3 className="text-4xl font-bold text-white">The Founders</h3>
                        <p className="text-zinc-500 max-w-xl mx-auto">
                            Meet the visionaries who started the Code Wizard community to bridge the gap between classroom and industry.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {FOUNDERS.map((founder, idx) => (
                            <div
                                key={idx}
                                className="group p-8 bg-zinc-950/50 border border-white/5 rounded-[2.5rem] text-center hover:bg-zinc-900/50 transition-all duration-500 hover:-translate-y-2"
                            >
                                <div className="relative w-24 h-24 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity" />
                                    <img
                                        src={founder.image}
                                        alt={founder.name}
                                        className="w-full h-full rounded-full border-2 border-white/5 relative z-10 p-1 grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-1">{founder.name}</h4>
                                <p className="text-sm text-blue-500 font-bold tracking-tight mb-4 uppercase">
                                    {founder.role}
                                </p>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    {founder.bio}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA / Contact Section - ONLY on landing page */}
            {mode === "landing" && (
                <div className="p-12 bg-blue-600 rounded-[3rem] text-center space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative z-10 space-y-4">
                        <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                            Ready to join the cult?
                        </h3>
                        <p className="text-blue-100/80 max-w-lg mx-auto font-medium">
                            Whether you're a curious freshman or a senior pro, there's always a seat at the table.
                        </p>
                        <button className="px-10 py-4 bg-white text-blue-600 rounded-full font-black text-sm uppercase tracking-widest hover:bg-zinc-100 transition shadow-xl shadow-blue-900/20 active:scale-95">
                            Start Your Journey
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
