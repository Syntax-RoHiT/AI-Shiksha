import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Search, Megaphone, Loader2, BookOpen, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Announcements as announcementsApi, Enrollments } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Announcement {
    id: string;
    title: string;
    content: string;
    created_at: string;
}

interface EnrolledCourse {
    id: string;
    course_id?: string;
    progress?: number;
    course?: {
        id: string;
        title: string;
        slug?: string;
        thumbnail_url?: string;
        thumbnail?: string;
    };
}

export function StudentNavbar() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [hasViewedAnnouncements, setHasViewedAnnouncements] = useState(() => {
        return localStorage.getItem('announcements_viewed') === 'true';
    });
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadAnnouncements();
        loadEnrolledCourses();
    }, []);

    // Close search results on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadAnnouncements = async () => {
        try {
            setAnnouncementsLoading(true);
            const data = await announcementsApi.getStudentActive();
            setAnnouncements(data);
            
            // If new announcements are found and they are different from what was last seen, reset the badge
            const lastSeenId = localStorage.getItem('last_announcement_id');
            if (data.length > 0 && data[0].id !== lastSeenId) {
                setHasViewedAnnouncements(false);
                localStorage.setItem('announcements_viewed', 'false');
                localStorage.setItem('last_announcement_id', data[0].id);
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    const loadEnrolledCourses = async () => {
        try {
            setSearchLoading(true);
            const data = await Enrollments.getMyEnrollments();
            setEnrolledCourses(data || []);
        } catch (error) {
            console.error("Failed to load enrolled courses:", error);
        } finally {
            setSearchLoading(false);
        }
    };

    const filteredCourses = searchQuery.trim().length > 0
        ? enrolledCourses.filter((enrollment) => {
            const title = enrollment.course?.title || "";
            return title.toLowerCase().includes(searchQuery.toLowerCase());
        })
        : [];

    const handleCourseClick = (enrollment: EnrolledCourse) => {
        const slug = enrollment.course?.slug || enrollment.course?.id || enrollment.course_id;
        setShowResults(false);
        setSearchQuery("");
        if (slug) navigate(`/course/${slug}/view`);
    };

    return (
        <div className="flex items-center justify-between w-full gap-3">
            {/* Search Bar */}
            <div ref={searchRef} className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
                <Input
                    placeholder="Search my courses..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="pl-10 pr-8 h-10 bg-white border-0 shadow-sm ring-1 ring-inset ring-gray-200 focus-visible:ring-2 focus-visible:ring-lms-blue/20 w-full"
                />
                {searchQuery && (
                    <button
                        onClick={() => { setSearchQuery(""); setShowResults(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}

                {/* Search Results Dropdown */}
                {showResults && searchQuery.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-80">
                        {searchLoading ? (
                            <div className="flex items-center justify-center p-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">No enrolled courses match "<span className="font-medium">{searchQuery}</span>"</p>
                                <button
                                    onClick={() => { navigate("/courses"); setShowResults(false); }}
                                    className="mt-2 text-xs text-lms-blue hover:underline"
                                >
                                    Browse all courses →
                                </button>
                            </div>
                        ) : (
                            <ul className="py-1.5">
                                {filteredCourses.map((enrollment) => (
                                    <li key={enrollment.id}>
                                        <button
                                            onClick={() => handleCourseClick(enrollment)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            {enrollment.course?.thumbnail_url || enrollment.course?.thumbnail ? (
                                                <img
                                                    src={enrollment.course.thumbnail_url || enrollment.course.thumbnail}
                                                    alt={enrollment.course.title}
                                                    className="h-10 w-16 object-cover rounded-md flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="h-10 w-16 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                    <BookOpen className="h-4 w-4 text-blue-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {enrollment.course?.title || "Untitled Course"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Progress
                                                        value={enrollment.progress || 0}
                                                        className="h-1.5 flex-1 bg-gray-100 [&>div]:bg-lms-blue"
                                                    />
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                        {enrollment.progress || 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Announcements Bell */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="relative bg-white border-gray-200 hover:bg-gray-50 h-10 w-10 rounded-full shadow-sm"
                            onClick={() => {
                                setHasViewedAnnouncements(true);
                                localStorage.setItem('announcements_viewed', 'true');
                            }}
                        >
                            <Bell className="h-5 w-5 text-gray-600" />
                            {announcements.length > 0 && !hasViewedAnnouncements && (
                                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white transform translate-x-0.5 -translate-y-0.5 animate-pulse" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Megaphone className="h-4 w-4 text-lms-blue" />
                                Announcements
                            </h3>
                            {announcements.length > 0 && (
                                <span className="text-xs text-muted-foreground bg-gray-200 px-2 py-0.5 rounded-full">
                                    {announcements.length} new
                                </span>
                            )}
                        </div>
                        <ScrollArea className="h-[300px]">
                            {announcementsLoading ? (
                                <div className="flex justify-center items-center h-full py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm">No new announcements</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {announcements.map((item, index) => (
                                        <div key={item.id}>
                                            <div 
                                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedAnnouncement(item)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-medium text-[#1F1F1F] leading-snug">{item.title}</h4>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2">{item.content}</p>
                                            </div>
                                            {index < announcements.length - 1 && <Separator />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        {announcements.length > 0 && (
                            <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                                <Button variant="ghost" className="w-full text-xs h-8 text-lms-blue hover:text-lms-blue/80 hover:bg-blue-50">
                                    View All Announcements
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>
            <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{selectedAnnouncement?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="pt-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {selectedAnnouncement?.content}
                    </div>
                    <div className="mt-6 text-xs text-gray-400 text-right border-t pt-4">
                        Posted on {selectedAnnouncement && new Date(selectedAnnouncement.created_at).toLocaleDateString()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
