import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Courses, Enrollments, SystemSettings } from '@/lib/api';
import { toast } from 'sonner';
import {
    Loader2, PlayCircle, BookOpen, Clock, Award, FileText,
    ChevronDown, ChevronUp, Play, ChevronRight, Globe,
    Smartphone, LifeBuoy, CheckCircle2, ShieldCheck, Zap,
} from 'lucide-react';

export const EnrolledCourseView = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState<any>(null);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showTerms, setShowTerms] = useState(false);
    const [termsContent, setTermsContent] = useState('');
    const [accepted, setAccepted] = useState(false);
    const [processingTerms, setProcessingTerms] = useState(false);
    const [expandedSections, setExpandedSections] = useState<number[]>([0]);

    useEffect(() => { loadData(); }, [slug, user]);

    const loadData = async () => {
        if (!slug || !user) return;
        try {
            const courseData = await Courses.getBySlug(slug);
            setCourse(courseData);
            const myEnrollments = await Enrollments.getMyEnrollments();
            const currentEnrollment = myEnrollments.find((e: any) =>
                e.courseId === courseData.id || e.course_id === courseData.id || e.course?.id === courseData.id
            );
            if (currentEnrollment) {
                setEnrollment(currentEnrollment);
            } else {
                toast.error('You are not enrolled in this course');
                navigate(`/courses/${slug}`);
            }
        } catch {
            toast.error('Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    const getFirstLessonSlug = (): string | null => {
        const sections = course?.sections?.sort((a: any, b: any) => a.order_index - b.order_index);
        if (sections?.length > 0) {
            const items = sections[0]?.items?.sort((a: any, b: any) => a.order_index - b.order_index);
            if (items?.[0]?.slug) return items[0].slug;
        }
        if (course?.modules?.[0]?.lessons?.[0]) {
            const l = course.modules[0].lessons[0];
            return l.slug || l.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
        }
        return null;
    };

    const navigateToLesson = () => {
        const lessonSlug = getFirstLessonSlug();
        if (lessonSlug && course?.slug) navigate(`/learn/${course.slug}/lesson/${lessonSlug}`);
        else toast.error('No lessons found in this course yet.');
    };

    const handleStartLearning = async () => {
        if (enrollment?.terms_accepted) {
            navigateToLesson();
        } else {
            try {
                const terms = await SystemSettings.getTerms();
                setTermsContent(terms.content);
                setShowTerms(true);
            } catch {
                toast.error('Failed to load Terms & Conditions');
            }
        }
    };

    const handleAcceptTerms = async () => {
        if (!course) return;
        setProcessingTerms(true);
        try {
            await Enrollments.acceptTerms(course.id);
            setEnrollment({ ...enrollment, terms_accepted: true });
            setShowTerms(false);
            toast.success('Terms accepted! Starting course...');
            setTimeout(navigateToLesson, 600);
        } catch {
            toast.error('Failed to accept terms. Please try again.');
        } finally {
            setProcessingTerms(false);
        }
    };

    const toggleSection = (idx: number) =>
        setExpandedSections(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);

    const totalLessons = () => {
        if (course?.sections) return course.sections.reduce((t: number, s: any) => t + (s.items?.length || 0), 0);
        if (course?.modules) return course.modules.reduce((t: number, m: any) => t + (m.lessons?.length || 0), 0);
        return 0;
    };

    const totalDuration = () => {
        if (course?.sections) {
            const mins = course.sections.reduce((t: number, s: any) =>
                t + (s.items?.reduce((sum: number, i: any) => sum + (i.duration_minutes || 0), 0) || 0), 0);
            if (!mins) return course?.duration || 'Self-paced';
            const h = Math.floor(mins / 60), m = mins % 60;
            return h === 0 ? `${mins}m` : m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
        return course?.duration || 'Self-paced';
    };

    const fmtDuration = (min?: number) => {
        if (!min) return '';
        if (min < 60) return `${min}m`;
        const h = Math.floor(min / 60), m = min % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const getIcon = (type: string) => {
        switch ((type || '').toLowerCase()) {
            case 'quiz': return FileText;
            case 'assignment': return BookOpen;
            default: return Play;
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <p className="text-sm text-gray-400 font-medium animate-pulse">Loading your course...</p>
            </div>
        </div>
    );

    if (!course) return null;

    const progress = enrollment?.progress || enrollment?.progress_percentage || 0;
    const completed = enrollment?.completedLessons || 0;
    const total = totalLessons();
    const sections = course.sections?.sort((a: any, b: any) => a.order_index - b.order_index) || [];
    const hasStarted = progress > 0;
    const instructorInitials = course.instructor?.user?.name?.split(' ').map((n: string) => n[0]).join('') || 'IN';

    // ─── Course Card (reused in both mobile + desktop sidebar) ───
    const CourseCard = () => (
        <div className="rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
                {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
                        <BookOpen className="h-14 w-14 text-blue-200" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-center justify-center">
                    <button
                        onClick={handleStartLearning}
                        className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                    >
                        <Play className="h-6 w-6 text-[#0056D2] ml-1" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-4">
                {/* Progress */}
                {hasStarted ? (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-gray-600">
                            <span>Your Progress</span>
                            <span>{completed}/{total} lessons</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-[#0056D2] [&>div]:to-[#00A3BF]" />
                        <p className="text-xs text-gray-400">{progress}% complete</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
                        <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span>You're enrolled — let's start!</span>
                    </div>
                )}

                <Button
                    onClick={handleStartLearning}
                    className="w-full rounded-xl bg-[#0056D2] hover:bg-[#004299] text-white font-bold h-11 gap-2 shadow-md shadow-blue-100 transition-all active:scale-95"
                >
                    <PlayCircle className="h-4 w-4" />
                    {hasStarted ? 'Continue Learning' : 'Start Learning'}
                </Button>

                {/* Includes */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">This course includes</p>
                    {[
                        { icon: Play, label: `${totalDuration()} on-demand video` },
                        { icon: BookOpen, label: `${total} lessons` },
                        ...(course.certificate_enabled ? [{ icon: Award, label: 'Certificate of completion' }] : []),
                        { icon: Smartphone, label: 'Mobile & desktop access' },
                        { icon: LifeBuoy, label: 'Full lifetime access' },
                    ].map(({ icon: Icon, label }, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                            <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden">

            {/* ─── Breadcrumb Nav (non-sticky) ─── */}
            <nav className="bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-auto py-3 flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-gray-500 min-w-0 overflow-hidden">
                        <Link to="/dashboard" className="hover:text-gray-800 transition-colors whitespace-nowrap flex-shrink-0">Dashboard</Link>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                        <Link to="/dashboard/my-courses" className="hover:text-gray-800 transition-colors whitespace-nowrap flex-shrink-0">My Courses</Link>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                        <span className="text-gray-800 font-medium truncate">{course.title}</span>
                    </div>
                    {hasStarted && (
                        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                            <div className="w-24">
                                <Progress value={progress} className="h-1.5 bg-gray-100 [&>div]:bg-[#0056D2]" />
                            </div>
                            <span className="text-xs font-bold text-gray-700">{progress}%</span>
                        </div>
                    )}
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#EEF2FF] via-white to-[#F0F9FF] py-8 md:py-10">
                <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-blue-100/50 blur-3xl" />
                <div className="pointer-events-none absolute top-10 right-0 w-56 h-56 rounded-full bg-indigo-100/40 blur-3xl" />

                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-10 items-center">

                    {/* ── Left: text ── */}
                    <div className="space-y-5">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                            {course.category?.name && (
                                <Badge className="bg-blue-50 text-[#0056D2] border border-blue-200/60 rounded-full px-3 py-0.5 text-xs font-semibold hover:bg-blue-50">
                                    {course.category.name}
                                </Badge>
                            )}
                            {course.level && (
                                <Badge className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-3 py-0.5 text-xs font-semibold hover:bg-gray-50">
                                    {course.level}
                                </Badge>
                            )}
                        </div>

                        {/* Title & subtitle */}
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-4xl font-extrabold text-[#111827] leading-snug tracking-tight">{course.title}</h1>
                            {course.subtitle && (
                                <p className="text-base md:text-lg text-gray-500 leading-relaxed">{course.subtitle}</p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-5 text-sm">
                            {[
                                { icon: Clock, label: totalDuration() },
                                { icon: BookOpen, label: `${total} lessons` },
                                { icon: Globe, label: course.language || 'English' },
                            ].map(({ icon: Icon, label }) => (
                                <span key={label} className="flex items-center gap-1.5 text-gray-600 font-medium">
                                    <Icon className="h-4 w-4 text-gray-400" />{label}
                                </span>
                            ))}
                        </div>

                        {/* Instructor chip */}
                        {course.instructor?.user?.name && (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                    {course.instructor.user.avatar_url && <AvatarImage src={course.instructor.user.avatar_url} />}
                                    <AvatarFallback className="bg-[#0056D2] text-white text-xs font-bold">{instructorInitials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xs text-gray-400 leading-none mb-0.5">Instructor</p>
                                    <p className="text-sm font-semibold text-gray-800">{course.instructor.user.name}</p>
                                </div>
                            </div>
                        )}

                        {/* Mobile CTA */}
                        <div className="flex gap-3 pt-1 lg:hidden">
                            <Button
                                onClick={handleStartLearning}
                                className="w-full rounded-full bg-[#0056D2] hover:bg-[#004299] text-white font-bold gap-2 shadow-md shadow-blue-200 active:scale-95"
                            >
                                <PlayCircle className="h-5 w-5" />
                                {hasStarted ? 'Continue Learning' : 'Start Learning'}
                            </Button>
                        </div>
                    </div>{/* end left col */}

                    {/* ── Right: Learning Illustration ── */}
                    <div className="hidden lg:flex items-center justify-center relative select-none">
                        <svg viewBox="0 0 480 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md drop-shadow-xl">
                            {/* Background glow circles */}
                            <circle cx="240" cy="190" r="160" fill="url(#glowGrad)" opacity="0.18" />
                            <circle cx="240" cy="190" r="110" fill="url(#glowGrad)" opacity="0.12" />

                            {/* Laptop body */}
                            <rect x="90" y="155" width="300" height="185" rx="14" fill="#1E40AF" />
                            <rect x="100" y="163" width="280" height="168" rx="8" fill="#1D4ED8" />
                            {/* Laptop screen */}
                            <rect x="108" y="171" width="264" height="152" rx="5" fill="#EFF6FF" />
                            {/* Screen content lines */}
                            <rect x="122" y="186" width="120" height="8" rx="4" fill="#BFDBFE" />
                            <rect x="122" y="202" width="90" height="6" rx="3" fill="#DBEAFE" />
                            <rect x="122" y="216" width="105" height="6" rx="3" fill="#DBEAFE" />
                            <rect x="122" y="230" width="80" height="6" rx="3" fill="#E0E7FF" />
                            {/* Code blocks on screen */}
                            <rect x="122" y="248" width="200" height="28" rx="6" fill="#EDE9FE" />
                            <rect x="130" y="256" width="70" height="5" rx="2.5" fill="#A78BFA" />
                            <rect x="130" y="265" width="50" height="4" rx="2" fill="#C4B5FD" />
                            <rect x="188" y="256" width="40" height="5" rx="2.5" fill="#818CF8" />
                            {/* Progress bar on screen */}
                            <rect x="122" y="284" width="236" height="12" rx="6" fill="#E0E7FF" />
                            <rect x="122" y="284" width="160" height="12" rx="6" fill="url(#progressGrad)" />
                            {/* Avatar on screen */}
                            <circle cx="322" cy="200" r="22" fill="#DBEAFE" />
                            <circle cx="322" cy="196" r="8" fill="#93C5FD" />
                            <path d="M305 218 Q322 208 339 218" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" fill="none" />
                            {/* Laptop base / keyboard */}
                            <rect x="75" y="338" width="330" height="14" rx="7" fill="#1E3A8A" />
                            <rect x="180" y="336" width="120" height="6" rx="3" fill="#1E40AF" />

                            {/* Book 1 (left, floating) */}
                            <g transform="translate(38,120) rotate(-12)">
                                <rect width="52" height="66" rx="5" fill="#F59E0B" />
                                <rect x="6" width="6" height="66" rx="3" fill="#D97706" />
                                <rect x="14" y="14" width="28" height="4" rx="2" fill="#FDE68A" />
                                <rect x="14" y="22" width="22" height="3" rx="1.5" fill="#FDE68A" />
                                <rect x="14" y="29" width="26" height="3" rx="1.5" fill="#FDE68A" />
                            </g>
                            {/* Book 2 (right, floating) */}
                            <g transform="translate(390,100) rotate(15)">
                                <rect width="48" height="60" rx="5" fill="#10B981" />
                                <rect x="5" width="6" height="60" rx="3" fill="#059669" />
                                <rect x="13" y="13" width="25" height="4" rx="2" fill="#A7F3D0" />
                                <rect x="13" y="21" width="18" height="3" rx="1.5" fill="#A7F3D0" />
                                <rect x="13" y="28" width="22" height="3" rx="1.5" fill="#A7F3D0" />
                            </g>

                            {/* Graduation Cap */}
                            <g transform="translate(195,36)">
                                {/* Board */}
                                <polygon points="45,14 90,28 45,42 0,28" fill="#4F46E5" />
                                <polygon points="45,14 90,28 45,42 0,28" fill="#4338CA" opacity="0.3" />
                                {/* Hat top */}
                                <rect x="33" y="42" width="24" height="22" rx="2" fill="#4F46E5" />
                                <rect x="33" y="42" width="24" height="4" rx="2" fill="#6366F1" />
                                {/* Tassel */}
                                <line x1="75" y1="28" x2="75" y2="55" stroke="#F59E0B" strokeWidth="2" />
                                <circle cx="75" cy="57" r="5" fill="#F59E0B" />
                            </g>

                            {/* Pencil  */}
                            <g transform="translate(400,200) rotate(30)">
                                <rect x="0" y="0" width="12" height="60" rx="3" fill="#FCD34D" />
                                <polygon points="0,60 12,60 6,75" fill="#F87171" />
                                <rect x="0" y="0" width="12" height="8" rx="3" fill="#9CA3AF" />
                                <rect x="3" y="63" width="6" height="9" fill="#F5F5F4" />
                            </g>

                            {/* Stars / sparkles */}
                            {/* big star */}
                            <g transform="translate(68,62)">
                                <path d="M10 0 L12 8 L20 8 L14 13 L16 21 L10 16 L4 21 L6 13 L0 8 L8 8 Z" fill="#FCD34D" />
                            </g>
                            {/* small star right */}
                            <g transform="translate(395,68)">
                                <path d="M6 0L7.5 5H13L8.5 8L10 13L6 10L2 13L3.5 8L-1 5H4.5Z" fill="#A78BFA" />
                            </g>
                            {/* tiny sparkle top */}
                            <g transform="translate(155,42)">
                                <line x1="5" y1="0" x2="5" y2="10" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
                                <line x1="0" y1="5" x2="10" y2="5" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
                            </g>
                            {/* tiny sparkle bottom right */}
                            <g transform="translate(420,290)">
                                <line x1="5" y1="0" x2="5" y2="10" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
                                <line x1="0" y1="5" x2="10" y2="5" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
                            </g>
                            {/* dot bubbles */}
                            <circle cx="60" cy="220" r="6" fill="#E0E7FF" />
                            <circle cx="44" cy="245" r="4" fill="#DBEAFE" />
                            <circle cx="430" cy="160" r="5" fill="#D1FAE5" />
                            <circle cx="450" cy="185" r="3.5" fill="#A7F3D0" />
                            <circle cx="155" cy="345" r="5" fill="#FDE68A" opacity="0.7" />
                            <circle cx="330" cy="350" r="4" fill="#DDD6FE" opacity="0.8" />

                            {/* Trophy / achievement badge floating top-right */}
                            <g transform="translate(368,36)">
                                <rect x="0" y="14" width="40" height="30" rx="20" fill="#F59E0B" />
                                <rect x="14" y="44" width="12" height="10" rx="2" fill="#D97706" />
                                <rect x="8" y="52" width="24" height="6" rx="3" fill="#B45309" />
                                {/* Trophy handles */}
                                <path d="M0 22 Q-8 28 0 34" stroke="#D97706" strokeWidth="3" fill="none" strokeLinecap="round" />
                                <path d="M40 22 Q48 28 40 34" stroke="#D97706" strokeWidth="3" fill="none" strokeLinecap="round" />
                                {/* Star on trophy */}
                                <path d="M20 20 L22 26 L28 26 L23 30 L25 36 L20 32 L15 36 L17 30 L12 26 L18 26 Z" fill="white" opacity="0.9" />
                            </g>

                            {/* Gradient defs */}
                            <defs>
                                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#818CF8" />
                                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                                </radialGradient>
                                <linearGradient id="progressGrad" x1="0" x2="1" y1="0" y2="0">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#6366F1" />
                                </linearGradient>
                            </defs>
                        </svg>

                    </div>{/* end right col */}

                    </div>{/* end grid */}
                </div>
            </section>


            {/* ─── Body ─── */}
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                <div className="grid lg:grid-cols-3 gap-6 md:gap-10">

                    {/* ─── Left: main content ─── */}
                    <div className="lg:col-span-2 space-y-6 md:space-y-10">

                        {/* Mobile card */}
                        <div className="lg:hidden">
                            <CourseCard />
                        </div>

                        {/* About */}
                        {course.description && (
                            <section>
                                <h2 className="text-xl font-bold text-[#111827] mb-3">About this course</h2>
                                <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-7 shadow-sm overflow-hidden">
                                    <div
                                        className="prose prose-gray max-w-none text-[#374151] text-sm leading-[1.75]
                                                   prose-headings:font-bold prose-headings:text-[#111827]
                                                   prose-a:text-[#0056D2] prose-a:no-underline hover:prose-a:underline
                                                   prose-ul:list-disc prose-ol:list-decimal"
                                        dangerouslySetInnerHTML={{ __html: course.description }}
                                    />
                                </div>
                            </section>
                        )}

                        {/* Curriculum */}
                        {sections.length > 0 && (
                            <section>
                                <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                                    <h2 className="text-xl font-bold text-[#111827]">Course Content</h2>
                                    <span className="text-sm text-gray-400 whitespace-nowrap">{sections.length} sections · {total} lessons · {totalDuration()}</span>
                                </div>
                                <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-white">
                                    {sections.map((section: any, si: number) => (
                                        <div key={section.id} className={si !== 0 ? 'border-t border-gray-100' : ''}>
                                            <button
                                                onClick={() => toggleSection(si)}
                                                className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50/80 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <span className="flex-shrink-0 h-7 w-7 rounded-full bg-[#EEF2FF] text-[#0056D2] text-xs font-bold flex items-center justify-center">
                                                        {si + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm text-[#111827] truncate">{section.title}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{section.items?.length || 0} lessons</p>
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 ml-4">
                                                    {expandedSections.includes(si)
                                                        ? <ChevronUp className="h-4 w-4 text-gray-400" />
                                                        : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                                </div>
                                            </button>
                                            {expandedSections.includes(si) && (
                                                <div className="bg-gray-50/40 divide-y divide-gray-100/70">
                                                    {(section.items || [])
                                                        .sort((a: any, b: any) => a.order_index - b.order_index)
                                                        .map((item: any) => {
                                                            const Icon = getIcon(item.item_type);
                                                            return (
                                                                <div key={item.id} className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-white/60 transition-colors">
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                        <span className="text-sm text-gray-700 truncate">{item.title}</span>
                                                                    </div>
                                                                    {item.duration_minutes && (
                                                                        <span className="text-xs text-gray-400 ml-3 flex-shrink-0">{fmtDuration(item.duration_minutes)}</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Instructor */}
                        {course.instructor?.user && (
                            <section>
                                <h2 className="text-xl font-bold text-[#111827] mb-4">Your Instructor</h2>
                                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 md:p-7 flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                                    <Avatar className="h-14 w-14 md:h-16 md:w-16 flex-shrink-0 border-2 border-gray-100 shadow-sm">
                                        {course.instructor.user.avatar_url && <AvatarImage src={course.instructor.user.avatar_url} />}
                                        <AvatarFallback className="bg-[#0056D2] text-white text-lg font-bold">{instructorInitials}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-[#0056D2]">{course.instructor.user.name}</h3>
                                        <p className="text-sm text-gray-500 mb-2 truncate">{course.instructor.user.email}</p>
                                        {course.instructor.bio && (
                                            <p className="text-sm text-gray-600 leading-relaxed">{course.instructor.bio}</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ─── Right: sticky sidebar (desktop only) ─── */}
                    <div className="hidden lg:block">
                        <div className="sticky top-6 space-y-5">
                            <CourseCard />

                            {/* Details card */}
                            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 bg-gray-50/70 border-b border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Course Details</p>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {[
                                        { icon: Clock, label: 'Duration', value: totalDuration() },
                                        { icon: BookOpen, label: 'Lessons', value: `${total}` },
                                        { icon: Globe, label: 'Level', value: course.level || 'All Levels' },
                                        { icon: Award, label: 'Certificate', value: course.certificate_enabled ? '✓ Included' : 'Not available' },
                                    ].map(({ icon: Icon, label, value }) => (
                                        <div key={label} className="flex items-center justify-between px-5 py-3">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Icon className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-sm">{label}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-[#111827]">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Terms & Conditions Dialog ─── */}
            <Dialog open={showTerms} onOpenChange={(o) => { if (!processingTerms) setShowTerms(o); }}>
                <DialogContent className="max-w-2xl p-0 rounded-3xl overflow-hidden gap-0 shadow-2xl border-0">
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-[#0056D2] to-[#0098C7] text-white px-8 pt-8 pb-7 overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white mb-1">Terms & Conditions</DialogTitle>
                                <DialogDescription className="text-blue-100 text-sm">
                                    Review and accept to unlock your learning journey.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <ScrollArea className="h-[300px] bg-white">
                        <div className="px-8 py-6">
                            {termsContent ? (
                                <div
                                    className="prose prose-sm max-w-none text-gray-700
                                               prose-headings:font-bold prose-headings:text-[#111827]
                                               prose-a:text-[#0056D2] prose-ul:list-disc prose-ol:list-decimal"
                                    dangerouslySetInnerHTML={{ __html: termsContent }}
                                />
                            ) : (
                                <div className="h-40 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="bg-gray-50 border-t border-gray-100 px-8 py-5 space-y-4">
                        <label htmlFor="accept-terms" className="flex items-start gap-3 cursor-pointer group">
                            <Checkbox
                                id="accept-terms"
                                checked={accepted}
                                onCheckedChange={(c) => setAccepted(c as boolean)}
                                className="mt-0.5 rounded"
                            />
                            <span className="text-sm text-gray-600 leading-relaxed select-none group-hover:text-gray-900 transition-colors">
                                I have read and agree to the <span className="font-semibold text-gray-900">Terms & Conditions</span>.
                            </span>
                        </label>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowTerms(false)}
                                disabled={processingTerms}
                                className="flex-1 rounded-full border-gray-200 text-gray-600 h-11"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAcceptTerms}
                                disabled={!accepted || processingTerms}
                                className="flex-1 rounded-full bg-[#0056D2] hover:bg-[#004299] text-white font-semibold h-11 gap-2 shadow-md shadow-blue-200 active:scale-95"
                            >
                                {processingTerms
                                    ? <><Loader2 className="h-4 w-4 animate-spin" />Accepting...</>
                                    : <><CheckCircle2 className="h-4 w-4" />Accept &amp; Start Course</>
                                }
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
