import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UnifiedNavbar from "@/components/layout/UnifiedNavbar";
import Footer from "@/components/marketing/Footer";
import { LandingChatbot } from "@/components/marketing/LandingChatbot";
import { Courses as CoursesAPI } from "@/lib/api";

const Hero = () => {
    return (
        <section className="relative flex flex-col md:min-h-screen pt-16 md:pt-24 bg-black">
            <div className="relative md:absolute md:inset-0 w-full h-[45vh] md:h-full overflow-hidden pointer-events-none">
                <video autoPlay loop muted playsInline className="min-w-full min-h-full w-auto h-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 object-cover brightness-75 md:brightness-50 md:scale-110">
                    <source src="/landing_page/landing.mp4" type="video/mp4" />
                </video>
            </div>

            <div className="relative z-10 flex-1 flex items-center px-6 md:px-12 py-10 md:py-20">
                <div className="max-w-6xl mx-auto w-full">
                    <div className="z-10 max-w-4xl">
                        <span className="inline-block font-body text-white uppercase tracking-[0.2em] text-[11px] mb-8 font-bold opacity-80">NEXT-GEN SAFETY LEARNING MANAGEMENT SYSTEM</span>
                        <h1 className="font-headline text-4xl sm:text-5xl md:text-8xl font-black uppercase leading-[0.9] tracking-tighter mb-10">
                            MASTER SAFETY <br />
                            EXCELLENCE WITH <span className="text-[#A3FF12] italic">AI-DRIVEN LMS.</span>
                        </h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                            <p className="font-body text-zinc-300 text-sm leading-relaxed">
                                Empower your workforce with our Next-Gen Enterprise LMS. From automated compliance tracking to immersive high-risk training simulations, our intelligent platform ensures every team member reaches peak industrial certification standards seamlessly.
                            </p>
                            <p className="font-body text-zinc-300 text-sm leading-relaxed">
                                Our architecture tailors learning paths to individual performance, closing skill gaps before they become safety hazards. Transform passive compliance into an active, globally-applicable culture of operational mastery.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/courses" className="group border border-white text-white font-headline font-bold uppercase tracking-widest px-8 py-4 text-xs flex items-center gap-3 hover:bg-white/10 transition-all">
                                <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                                EXPLORE THE COURSES
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const LogoMarquee = () => {
    return (
        <section className="bg-black py-10 md:py-16 px-6 md:px-12 border-t border-white/5 overflow-hidden">
            <div className="max-w-[1920px] mx-auto text-center mb-10">
                <h2 className="font-headline text-sm font-bold uppercase tracking-[0.4em] text-zinc-500">OFFICIAL ACCREDITATION PARTNERS</h2>
            </div>
            <div className="relative flex overflow-hidden">
                <div className="flex animate-marquee">
                    <div className="flex whitespace-nowrap gap-24 items-center pr-24">
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">OSHA</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">IOSH</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">ISO 45001</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">ANSI</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">ASSP</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">NSC</span>
                    </div>
                    <div className="flex whitespace-nowrap gap-24 items-center pr-24" aria-hidden="true">
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">OSHA</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">IOSH</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">ISO 45001</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">ANSI</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">ASSP</span>
                        <span className="font-headline font-black text-4xl tracking-tighter opacity-40 grayscale hover:opacity-100 transition-opacity">NSC</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

interface ApiCourse { id: string; slug: string; title: string; instructor: string; thumbnail?: string; level?: string; }
const FeaturedCourses = () => {
    const [dbCourses, setDbCourses] = useState<ApiCourse[]>([]);
    useEffect(() => { CoursesAPI.getAll(false).then(setDbCourses).catch(console.error); }, []);

    if (dbCourses.length === 0) return null;

    return (
        <section className="py-16 md:py-32 px-6 md:px-12 bg-black border-y border-white/5">
            <div className="max-w-[1400px] mx-auto">
                <span className="font-headline text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4 block">EXPERTLY CRAFTED</span>
                <h2 className="font-headline text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-16 leading-none">BROWSE <span className="italic text-[#A3FF12]">TOP COURSES.</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {dbCourses.slice(0, 3).map((c, i) => (
                        <div key={i} className="group bg-[#151515] border border-white/10 rounded-lg overflow-hidden relative transition-all duration-700 flex flex-col h-full hover:shadow-[0_0_40px_rgba(163,255,18,0.15)] hover:border-[#A3FF12]/40 hover:-translate-y-1">
                            <div className="absolute inset-x-0 -bottom-2 h-1 bg-gradient-to-r from-transparent via-[#A3FF12] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[2px]"></div>
                            <div className="relative aspect-video overflow-hidden">
                                <img src={c.thumbnail || "/landing_page/safety-pro.jpg"} alt={c.title} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-4 left-4 z-10">
                                    <span className="bg-[#A3FF12] text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1">{c.level || "Popular"}</span>
                                </div>
                            </div>
                            <div className="p-8 flex flex-col flex-1">
                                <h3 className="font-headline text-2xl font-black uppercase tracking-tight mb-4 flex-1">{c.title}</h3>
                                <div className="flex items-center gap-3 text-zinc-400 font-body text-sm mb-6">
                                    <span className="material-symbols-outlined text-sm">school</span>
                                    {c.instructor}
                                </div>
                                <Link to={`/courses/${c.slug}`} className="flex items-center gap-2 text-[#d2ff9a] font-headline text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all mt-auto border-t border-white/10 pt-6">
                                    START COURSE <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FourPaths = () => {
    return (
        <section className="py-16 md:py-32 px-6 md:px-12 bg-black">
            <div className="max-w-[1400px] mx-auto">
                <span className="font-headline text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4 block">FOUR PATHS TO SMARTER EHS</span>
                <h2 className="font-headline text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-16 leading-none">START WHERE YOU WANT TO <br />MOVE <span className="italic text-[#A3FF12]">FASTER.</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    <div className="relative group overflow-hidden bg-zinc-900 aspect-square md:aspect-auto">
                        <img alt="AI Safety Data" className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 group-hover:scale-105 transition-transform duration-700" src="/landing_page/01-How-to-Become-a-Safety-Manager.jpg" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-12">
                            <h3 className="font-headline text-3xl font-black uppercase mb-4 leading-tight">TURN YOUR EHS DATA INTO EARLY WARNINGS WITH AI.</h3>
                            <p className="font-body text-zinc-300 text-sm max-w-md mb-8">See how AI analyzes your incident data, SDSs, and learning patterns to surface risks before they manifest as site hazards.</p>
                            <Link to="/courses" className="w-12 h-12 rounded-full border border-white flex items-center justify-center group-hover:bg-[#A3FF12] group-hover:border-[#A3FF12] transition-colors">
                                <span className="material-symbols-outlined text-white group-hover:text-black">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="bg-[#2a2825] p-10 flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-[#A3FF12] text-3xl">check_circle</span>
                                <h3 className="font-headline text-2xl font-black uppercase tracking-tight">ACCESS EXPERT RESOURCES, GUIDES AND EVENTS.</h3>
                            </div>
                            <Link to="/courses" className="text-[#A3FF12] font-headline font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                                VIEW ALL RESOURCES <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                        <div className="relative flex-1 group overflow-hidden bg-zinc-900 min-h-[400px]">
                            <img alt="EHS Tooling" className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 group-hover:scale-105 transition-transform duration-700" src="/landing_page/7-responsibility safety officer.webp" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-10">
                                <h3 className="font-headline text-2xl font-black uppercase mb-4 leading-tight">BRING EVERY CRITICAL EHS TOOL UNDER ONE ROOF.</h3>
                                <p className="font-body text-zinc-300 text-xs max-w-xs mb-6">One integrated platform. No data gaps. Get back to leading safety, not managing disparate software systems.</p>
                                <button className="w-10 h-10 rounded-full border border-white flex items-center justify-center group-hover:bg-[#A3FF12] group-hover:border-[#A3FF12] transition-colors">
                                    <span className="material-symbols-outlined text-white group-hover:text-black text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                        <div className="bg-[#2a2825] p-10 flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-[#A3FF12] text-3xl">check_circle</span>
                                <h3 className="font-headline text-2xl font-black uppercase tracking-tight">TARGET YOUR BIGGEST GAPS WITH THE RIGHT TOOLS.</h3>
                            </div>
                            <Link to="/courses" className="text-[#A3FF12] font-headline font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                                EXPLORE SOLUTIONS <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const SpeedOfNow = () => {
    return (
        <section className="py-16 md:py-32 px-6 md:px-12 bg-black">
            <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
                <div className="lg:w-1/2">
                    <h2 className="font-headline text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">GET SAFETY AT THE SPEED OF <span className="text-[#A3FF12]">NOW.</span></h2>
                    <p className="font-body text-zinc-400 text-lg leading-relaxed max-w-xl">
                        It's not just about moving fast. It's about speed with purpose. AI SHIKSHA transforms your programs from reactive to proactive, ensuring your workforce is site-ready before the shift even starts.
                    </p>
                </div>
                <div className="lg:w-1/2 flex flex-col border-t border-white/10">
                    <details className="group border-b border-white/10" open>
                        <summary className="flex items-center justify-between py-8 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-[#A3FF12]">verified</span>
                                <span className="font-headline text-xl font-bold uppercase tracking-tight">One Platform. Endless Possibilities.</span>
                            </div>
                            <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-45 group-open:text-[#A3FF12]">add</span>
                        </summary>
                        <div className="pb-8 pl-12 font-body text-zinc-400 text-sm leading-relaxed">
                            Unify your OSHA compliance, IOSH certifications, and NEBOSH standards into a single, AI-driven dashboard that tracks every trainee in real-time.
                        </div>
                    </details>
                    <details className="group border-b border-white/10">
                        <summary className="flex items-center justify-between py-8 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-[#A3FF12]">verified</span>
                                <span className="font-headline text-xl font-bold uppercase tracking-tight">Intuitive by Design. Made for Speed.</span>
                            </div>
                            <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-45 group-open:text-[#A3FF12]">add</span>
                        </summary>
                        <div className="pb-8 pl-12 font-body text-zinc-400 text-sm leading-relaxed">
                            User interfaces optimized for high-stress industrial environments. No manual needed—training flows naturally from lesson to certification.
                        </div>
                    </details>
                    <details className="group border-b border-white/10">
                        <summary className="flex items-center justify-between py-8 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-[#A3FF12]">verified</span>
                                <span className="font-headline text-xl font-bold uppercase tracking-tight">Cut the Drag. Keep the Pace.</span>
                            </div>
                            <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-45 group-open:text-[#A3FF12]">add</span>
                        </summary>
                        <div className="pb-8 pl-12 font-body text-zinc-400 text-sm leading-relaxed">
                            Automate the paperwork. Our AI handles the reporting and audit trails so you can focus on building a zero-harm safety culture.
                        </div>
                    </details>
                </div>
            </div>
        </section>
    );
};

const ExpandingSmarterTraining = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const tabs = [
        { title: "Spot Risks Before They Escalate.", id: 0 },
        { title: "Simplify Compliance Instantly.", id: 1 },
        { title: "Focus Where It Matters Most.", id: 2 },
    ];
    return (
        <section className="py-16 md:py-32 px-6 md:px-12 bg-black border-y border-white/5">
            <div className="max-w-[1400px] mx-auto">
                <div className="mb-12 md:mb-20">
                    <span className="font-body text-[#A3FF12] uppercase tracking-[0.4em] text-xs mb-4 font-bold block">VELOCITYAI: THE TRAINING CORE</span>
                    <h2 className="font-headline text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                        SMARTER TRAINING, <br />
                        <span className="text-[#A3FF12] italic">FASTER COMPLIANCE.</span>
                    </h2>
                    <p className="font-body text-zinc-400 text-lg max-w-2xl leading-relaxed">
                        AI SHIKSHA integrates VelocityAI at its core. It’s built into the tools you use already and trained on real-world industrial safety data.
                    </p>
                </div>
                <div className="flex flex-col lg:flex-row bg-[#151515] border border-white/10 overflow-hidden">
                    <div className="lg:w-80 flex flex-col divide-y divide-white/5 bg-black">
                        {tabs.map((tab) => (
                            <button key={tab.id} onClick={() => setActiveIndex(tab.id)} className={`text-left p-10 hover:bg-zinc-900 transition-colors flex flex-col gap-4 group ${activeIndex === tab.id ? 'bg-zinc-900' : ''}`}>
                                <span className={`font-headline text-2xl font-black ${activeIndex === tab.id ? 'text-[#A3FF12]' : 'text-white/20'} group-hover:text-[#A3FF12] transition-colors`}>0{tab.id + 1}</span>
                                <span className="font-headline text-sm font-bold uppercase tracking-widest text-left leading-tight">{tab.title}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 relative min-h-[600px] overflow-hidden bg-black">
                        <div className={`absolute inset-0 flex flex-col md:flex-row transition-opacity duration-500 ${activeIndex === 0 ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
                            <div className="flex-1 p-12 md:p-16 z-10 flex flex-col justify-center bg-black">
                                <h3 className="font-headline text-4xl font-black uppercase tracking-tighter mb-6">VALIDATE SKILLS INSTANTLY.</h3>
                                <p className="font-body text-zinc-300 text-base mb-10 max-w-lg">
                                    Our Vēlo AI engine reviews incident reports and site performance in real-time. We ensure hidden risks are surfaced long before a near miss turns into a serious harm.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-[#A3FF12] text-lg">add</span>
                                        <p className="text-xs uppercase tracking-tight font-bold text-zinc-300">Analyze incidents in real time to flag high-risk misses.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-[#A3FF12] text-lg">add</span>
                                        <p className="text-xs uppercase tracking-tight font-bold text-zinc-300">Automatically identify hazard types for JSA training.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 relative min-h-[400px] md:min-h-0">
                                <img src="/landing_page/safety-pro.jpg" className="absolute inset-0 w-full h-full object-cover grayscale brightness-50" alt="" />
                            </div>
                        </div>
                        <div className={`absolute inset-0 flex flex-col md:flex-row transition-opacity duration-500 ${activeIndex === 1 ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
                            <div className="flex-1 p-12 md:p-16 z-10 flex flex-col justify-center bg-black">
                                <h3 className="font-headline text-4xl font-black uppercase tracking-tighter mb-6">COMPLIANCE MADE EFFORTLESS.</h3>
                                <p className="font-body text-zinc-300 text-base mb-10 max-w-lg">
                                    Speed up your documentation by 5x. VelocityAI automates the cross-referencing of IOSH and OSHA standards against your current training status.
                                </p>
                            </div>
                            <div className="flex-1 relative min-h-[300px] md:min-h-0">
                                <img src="/landing_page/01-How-to-Become-a-Safety-Manager.jpg" className="absolute inset-0 w-full h-full object-cover grayscale" alt="" />
                            </div>
                        </div>
                        <div className={`absolute inset-0 flex flex-col md:flex-row transition-opacity duration-500 ${activeIndex === 2 ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
                            <div className="flex-1 p-12 md:p-16 z-10 flex flex-col justify-center bg-black">
                                <h3 className="font-headline text-4xl font-black uppercase tracking-tighter mb-6">PRIORITIZE HUMAN SAFETY.</h3>
                                <p className="font-body text-zinc-300 text-base mb-10 max-w-lg">
                                    Stop fighting fires and start preventing them. Our LMS uses narrative analysis to identify which teams need immediate skill verification.
                                </p>
                            </div>
                            <div className="flex-1 relative min-h-[300px] md:min-h-0">
                                <img src="/landing_page/7-responsibility safety officer.webp" className="absolute inset-0 w-full h-full object-cover grayscale" alt="" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ExpertisePartner = () => {
    return (
        <section className="py-16 md:py-32 px-6 md:px-12 bg-black text-white border-y border-white/5">
            <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="lg:w-1/2">
                    <span className="font-headline text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-6 block">EXPERTISE AS A SERVICE</span>
                    <h2 className="font-headline text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-tight">GET A PARTNER IN YOUR <span className="italic underline decoration-[#A3FF12] decoration-8 underline-offset-8">CORNER,</span> NOT JUST A PLATFORM.</h2>
                    <p className="font-body text-zinc-600 text-lg leading-relaxed mb-10">
                        Behind our AI technology is a team of certified safety professionals. We don't just hand you the keys to the software; we help you drive the change in your organization. From onboarding to customized NEBOSH modules, we are with you at every step.
                    </p>
                    <Link to="/contact">
                        <button className="bg-white text-black font-headline font-black uppercase tracking-widest px-10 py-5 hover:bg-zinc-200 transition-all flex items-center gap-4">
                            SPEAK WITH AN EXPERT <span className="material-symbols-outlined">support_agent</span>
                        </button>
                    </Link>
                </div>
                <div className="lg:w-1/2 relative">
                    <img alt="Safety Partners" className="w-full h-[300px] md:h-[600px] object-cover grayscale brightness-90 shadow-2xl" src="/landing_page/contact.png" />
                    <div className="absolute -bottom-10 -right-10 bg-[#A3FF12] p-12 max-w-xs hidden md:block">
                        <p className="font-headline text-xl font-black uppercase text-black leading-tight">"THEIR TEAM DIDN'T JUST SELL US A TOOL, THEY BUILT US A CULTURE."</p>
                        <p className="font-body text-black/60 text-sm mt-4">— HSE DIRECTOR, GLOBAL LOGISTICS</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

const MobileApp = () => {
    return (
        <section className="py-16 md:py-32 px-6 md:px-12 bg-black border-t border-white/10">
            <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
                <div className="lg:w-1/2">
                    <h2 className="font-headline text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">PUT AWARD-WINNING <br /><span className="text-[#A3FF12] italic">MOBILE</span> TO WORK.</h2>
                    <p className="font-body text-zinc-400 text-lg leading-relaxed mb-10">
                        Safety doesn't happen at a desk. Our mobile LMS puts certifications, hazard reporting, and skill checks in the pockets of every frontline worker. Even in offline environments, your data stays synced and your compliance stays active.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                        <div className="border-l border-[#A3FF12] pl-6">
                            <span className="font-headline text-3xl font-black text-white block mb-2">OFFLINE</span>
                            <p className="font-body text-xs text-zinc-500 uppercase tracking-widest">Full functionality without connectivity.</p>
                        </div>
                        <div className="border-l border-[#A3FF12] pl-6">
                            <span className="font-headline text-3xl font-black text-white block mb-2">INSTANT</span>
                            <p className="font-body text-xs text-zinc-500 uppercase tracking-widest">Real-time notification on safety alerts.</p>
                        </div>
                    </div>
                </div>
                <div className="lg:w-1/2 flex justify-center items-center">
                    <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] aspect-[9/16] overflow-hidden shadow-[0_0_100px_rgba(163,255,18,0.15)] bg-black">
                        <img alt="Mobile App UI" className="absolute inset-0 w-full h-full object-cover grayscale brightness-90 hover:-translate-y-2 hover:grayscale-0 transition-all duration-700" src="/landing_page/mobile.png" />
                        <div className="absolute inset-0 bg-[#A3FF12]/5 pointer-events-none mix-blend-overlay"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Metrics = () => {
    return (
        <section className="py-16 md:py-32 px-6 md:px-12 border-y border-white/10 bg-black">
            <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row justify-center items-center gap-16 md:gap-24">
                <div className="text-center">
                    <div className="font-headline text-5xl sm:text-7xl font-black text-[#d2ff9a] mb-2 tracking-tighter">850K+</div>
                    <div className="font-body uppercase tracking-[0.2em] text-xs font-bold text-zinc-500">Courses Completed</div>
                </div>
                <div className="text-center">
                    <div className="font-headline text-5xl sm:text-7xl font-black text-white mb-2 tracking-tighter">1200+</div>
                    <div className="font-body uppercase tracking-[0.2em] text-xs font-bold text-zinc-500">Indian Enterprises</div>
                </div>
                <div className="text-center">
                    <div className="font-headline text-5xl sm:text-7xl font-black text-[#21e6ff] mb-2 tracking-tighter">100%</div>
                    <div className="font-body uppercase tracking-[0.2em] text-xs font-bold text-zinc-500">Compliance Guarantee</div>
                </div>
            </div>
        </section>
    );
};

const BottomCTA = () => {
    return (
        <section className="my-16 md:my-24 px-6 md:px-12 max-w-[1920px] mx-auto">
            <div className="bg-[#d2ff9a] p-12 md:p-24 flex flex-col md:flex-row justify-between items-center gap-12 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="w-full h-full" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #000 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>
                </div>
                <div className="z-10 text-center md:text-left text-[#375b00]">
                    <h2 className="font-headline text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">START LEARNING <br />TODAY</h2>
                    <p className="font-body opacity-80 text-lg max-w-md font-bold">Master industrial intelligence and elevate your safety standards with AI Shiksha.</p>
                </div>
                <div className="z-10">
                    <Link to="/signup">
                        <button className="bg-black text-white px-12 py-5 font-headline font-black uppercase tracking-widest text-lg hover:bg-zinc-800 transition-colors">START FREE TRIAL</button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default function Landing() {
    useEffect(() => {
        document.body.style.backgroundColor = 'black';
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

    return (
        <div className="min-h-screen bg-black font-body text-white selection:bg-[#d2ff9a] selection:text-[#375b00] overflow-x-hidden">
            <UnifiedNavbar />
            <main>
                <Hero />
                <LogoMarquee />
                <FourPaths />
                <FeaturedCourses />
                <SpeedOfNow />
                <ExpandingSmarterTraining />
                <ExpertisePartner />
                <MobileApp />
                <Metrics />
                <BottomCTA />
            </main>
            <Footer />
            <LandingChatbot />
        </div>
    );
}
