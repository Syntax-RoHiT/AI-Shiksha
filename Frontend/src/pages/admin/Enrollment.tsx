import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, BookOpen, TrendingUp, Calendar, UserPlus, Loader2, Search, MoreVertical, Trash2, Edit2, PlayCircle, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Enrollments, Courses, Users as UsersApi } from "@/lib/api";
import { Enrollment } from "./components/EnrollmentColumns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EnrollmentStats {
  total: number;
  active: number;
  completed: number;
  thisMonth: number;
  growth: number;
}

interface Course {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function EnrollmentPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [stats, setStats] = useState<EnrollmentStats>({
    total: 0,
    active: 0,
    completed: 0,
    thisMonth: 0,
    growth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);

  // Manual Enroll State
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadEnrollments(),
        loadStats(),
        loadCourses(),
        loadStudents()
      ]);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnrollments = async () => {
    try {
      const data = await Enrollments.getAll();
      setEnrollments(data);
    } catch (error) {
      console.error("Failed to load enrollments:", error);
      toast({
        title: "Error",
        description: "Failed to load enrollments",
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      const data = await Enrollments.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await Courses.getAll(true);
      setCourses(data);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await UsersApi.getAll('student');
      setStudents(data);
    } catch (error) {
      console.error("Failed to load students", error);
    }
  }

  const handleDeleteEnrollment = async (enrollment: Enrollment) => {
    if (!confirm(`Are you sure you want to remove ${enrollment.user.name} from ${enrollment.course.title}?`)) return;

    try {
      await Enrollments.delete(enrollment.id);
      toast({ title: "Success", description: "Enrollment removed successfully" });
      loadEnrollments();
      loadStats();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove enrollment", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (enrollment: Enrollment, status: string) => {
    try {
      await Enrollments.updateStatus(enrollment.id, status);
      toast({ title: "Success", description: `Status updated to ${status}` });
      loadEnrollments();
      loadStats();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedEnrollments.length) return;
    if (!confirm(`Are you sure you want to remove ${selectedEnrollments.length} enrollments?`)) return;
    try {
      await Promise.all(selectedEnrollments.map(id => Enrollments.delete(id)));
      toast({ title: "Success", description: `Removed ${selectedEnrollments.length} enrollments` });
      setSelectedEnrollments([]);
      loadEnrollments();
      loadStats();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove some enrollments", variant: "destructive" });
    }
  };

  const handleManualEnroll = async () => {
    if (selectedStudentIds.length === 0 || selectedCourseIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one student and one course.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await Enrollments.bulkEnroll(selectedStudentIds, selectedCourseIds);
      const { success, alreadyEnrolled, failed } = result;
      let description = `Successfully enrolled ${success} students.`;
      if (alreadyEnrolled > 0) description += ` ${alreadyEnrolled} were already enrolled.`;
      if (failed > 0) description += ` ${failed} failed.`;

      toast({
        title: failed > 0 ? "Enrollment Completed with Errors" : "Enrollment Successful",
        description: description,
        variant: failed > 0 ? "destructive" : "default"
      });

      setIsEnrollOpen(false);
      setSelectedStudentIds([]);
      setSelectedCourseIds([]);
      loadData();
    } catch (error: any) {
      console.error("Bulk enroll error", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to complete enrollment process",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAllStudents = () => {
    const visibleStudents = students.filter((s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
    );
    const allVisibleSelected = visibleStudents.length > 0 && visibleStudents.every(s => selectedStudentIds.includes(s.id));

    if (allVisibleSelected) {
      setSelectedStudentIds(state => state.filter(id => !visibleStudents.find(s => s.id === id)));
    } else {
      const newIds = [...selectedStudentIds];
      visibleStudents.forEach(s => {
        if (!newIds.includes(s.id)) newIds.push(s.id);
      });
      setSelectedStudentIds(newIds);
    }
  };

  const toggleAllCourses = () => {
    const visibleCourses = courses.filter((c) => c.title.toLowerCase().includes(courseSearch.toLowerCase()));
    const allVisibleSelected = visibleCourses.length > 0 && visibleCourses.every(c => selectedCourseIds.includes(c.id));

    if (allVisibleSelected) {
      setSelectedCourseIds(state => state.filter(id => !visibleCourses.find(c => c.id === id)));
    } else {
      const newIds = [...selectedCourseIds];
      visibleCourses.forEach(c => {
        if (!newIds.includes(c.id)) newIds.push(c.id);
      });
      setSelectedCourseIds(newIds);
    }
  };

  const filteredEnrollments = enrollments.filter(e => 
    e.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE": return "border-emerald-500/30 text-emerald-600 bg-emerald-500/5";
      case "COMPLETED": return "border-indigo-500/30 text-indigo-600 bg-indigo-500/5";
      case "DROPPED": return "border-red-500/30 text-red-600 bg-red-500/5";
      default: return "border-zinc-500/30 text-zinc-600 bg-zinc-500/5";
    }
  };

  return (
    <AdminDashboardLayout title="Enrollments" subtitle="Manage student access and course progress">
      <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto transition-all duration-700 ease-out animate-in fade-in slide-in-from-bottom-8">

        {/* Dynamic Header */}
        <div className="relative overflow-hidden rounded-none bg-zinc-950 p-8 shadow-2xl border border-white/10 group flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 opacity-50 transition-opacity duration-1000 group-hover:opacity-70"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/30 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
            
            <div className="relative z-10 space-y-2">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                    Enrollment Manager
                </h2>
                <p className="text-sm md:text-lg text-white/60 font-medium max-w-xl">
                    Administer student access to courses and monitor enrollment status globally.
                </p>
            </div>

            <div className="relative z-10 flex items-center shrink-0">
                <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 bg-white hover:bg-zinc-200 text-zinc-900 rounded-none font-bold uppercase tracking-widest px-6 w-full sm:w-auto">
                            <UserPlus className="h-5 w-5 mr-2" />
                            Manual Enroll
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl rounded-none border border-black/10 dark:border-white/10 p-0 overflow-hidden">
                        <DialogHeader className="p-6 bg-zinc-50 dark:bg-zinc-900 border-b border-black/5 dark:border-white/5">
                            <DialogTitle className="font-black text-xl uppercase tracking-widest">Manual Student Enrollment</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 p-6">
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Select Students</Label>
                                    <Button variant="ghost" size="sm" onClick={toggleAllStudents} className="h-6 px-2 text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-none">
                                        {(() => {
                                            const visibleStudents = students.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase()));
                                            const allVisibleSelected = visibleStudents.length > 0 && visibleStudents.every(s => selectedStudentIds.includes(s.id));
                                            return allVisibleSelected ? 'Deselect All' : 'Select All';
                                        })()}
                                    </Button>
                                </div>
                                <div className="border border-black/10 dark:border-white/10 rounded-none">
                                    <div className="p-3 border-b border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <Input
                                                placeholder="Search students..."
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                className="pl-9 h-10 rounded-none border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950"
                                            />
                                        </div>
                                    </div>
                                    <ScrollArea className="h-[180px]">
                                        <div className="p-2 space-y-1">
                                            {students.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase())).map((student) => (
                                                <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
                                                    <Checkbox
                                                        id={`student-${student.id}`}
                                                        checked={selectedStudentIds.includes(student.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setSelectedStudentIds([...selectedStudentIds, student.id]);
                                                            else setSelectedStudentIds(selectedStudentIds.filter((id) => id !== student.id));
                                                        }}
                                                        className="rounded-none"
                                                    />
                                                    <Label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white">
                                                        {student.name} <span className="text-zinc-400 font-medium ml-1 text-xs">({student.email})</span>
                                                    </Label>
                                                </div>
                                            ))}
                                            {students.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                                                <p className="text-sm text-center text-zinc-500 py-4 font-medium">No students found</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Select Courses</Label>
                                    <Button variant="ghost" size="sm" onClick={toggleAllCourses} className="h-6 px-2 text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-none">
                                        {(() => {
                                            const visibleCourses = courses.filter((c) => c.title.toLowerCase().includes(courseSearch.toLowerCase()));
                                            const allVisibleSelected = visibleCourses.length > 0 && visibleCourses.every(c => selectedCourseIds.includes(c.id));
                                            return allVisibleSelected ? 'Deselect All' : 'Select All';
                                        })()}
                                    </Button>
                                </div>
                                <div className="border border-black/10 dark:border-white/10 rounded-none">
                                    <div className="p-3 border-b border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <Input
                                                placeholder="Search courses..."
                                                value={courseSearch}
                                                onChange={(e) => setCourseSearch(e.target.value)}
                                                className="pl-9 h-10 rounded-none border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950"
                                            />
                                        </div>
                                    </div>
                                    <ScrollArea className="h-[180px]">
                                        <div className="p-2 space-y-1">
                                            {courses.filter((c) => c.title.toLowerCase().includes(courseSearch.toLowerCase())).map((course) => (
                                                <div key={course.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
                                                    <Checkbox
                                                        id={`course-${course.id}`}
                                                        checked={selectedCourseIds.includes(course.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setSelectedCourseIds([...selectedCourseIds, course.id]);
                                                            else setSelectedCourseIds(selectedCourseIds.filter((id) => id !== course.id));
                                                        }}
                                                        className="rounded-none"
                                                    />
                                                    <Label htmlFor={`course-${course.id}`} className="flex-1 cursor-pointer text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white">
                                                        {course.title}
                                                    </Label>
                                                </div>
                                            ))}
                                            {courses.filter((c) => c.title.toLowerCase().includes(courseSearch.toLowerCase())).length === 0 && (
                                                <p className="text-sm text-center text-zinc-500 py-4 font-medium">No courses found</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-black/5 dark:border-white/5">
                            <Button variant="outline" className="rounded-none font-bold uppercase tracking-widest text-xs" onClick={() => setIsEnrollOpen(false)}>Cancel</Button>
                            <Button className="rounded-none bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold uppercase tracking-widest text-xs" onClick={handleManualEnroll} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enroll Selected
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        {/* Floating Glass Stats */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                <div className="relative p-6 flex flex-col h-full z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-none flex items-center justify-center shadow-sm bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <div className="mt-auto space-y-1">
                        <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.total.toLocaleString()}</p>
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Total Enrollments</p>
                    </div>
                </div>
            </div>

            <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                <div className="relative p-6 flex flex-col h-full z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-none flex items-center justify-center shadow-sm bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                            <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <div className="mt-auto space-y-1">
                        <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.active.toLocaleString()}</p>
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Active Enrollments</p>
                    </div>
                </div>
            </div>

            <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                <div className="relative p-6 flex flex-col h-full z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-none flex items-center justify-center shadow-sm bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <div className="mt-auto space-y-1">
                        <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.thisMonth.toLocaleString()}</p>
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">This Month</p>
                    </div>
                </div>
            </div>

            <div className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                <div className="relative p-6 flex flex-col h-full z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-none flex items-center justify-center shadow-sm bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 group-hover:scale-110 transition-transform duration-500">
                            <TrendingUp className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        </div>
                    </div>
                    <div className="mt-auto space-y-1">
                        <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                            {stats.growth > 0 ? '+' : ''}{stats.growth}%
                        </p>
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">MoM Growth</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Ledger */}
        <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-black/5 dark:border-white/5 p-6 bg-white/40 dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-zinc-400" />
                    Enrollment Roster
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search by student or course..."
                            className="pl-9 h-10 rounded-none border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="rounded-none border-black/10 dark:border-white/10 shrink-0 h-10 w-10">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedEnrollments.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-900/50 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={selectedEnrollments.length === filteredEnrollments.length && filteredEnrollments.length > 0}
                            onCheckedChange={() => {
                                if (selectedEnrollments.length === filteredEnrollments.length) setSelectedEnrollments([]);
                                else setSelectedEnrollments(filteredEnrollments.map(e => e.id));
                            }}
                            className="border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:text-white rounded-none"
                        />
                        <span className="text-sm font-bold text-red-900 dark:text-red-200 uppercase tracking-widest">
                            {selectedEnrollments.length} Selected
                        </span>
                    </div>
                    <Button variant="destructive" size="sm" className="rounded-none text-xs font-bold uppercase tracking-widest gap-2" onClick={handleBulkDelete}>
                        <Trash2 className="h-3 w-3" />
                        Remove
                    </Button>
                </div>
            )}
            
            <div className="p-0">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-zinc-500 tracking-widest uppercase">Loading Enrollments...</p>
                    </div>
                ) : filteredEnrollments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center px-4">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-none flex items-center justify-center mb-2">
                            <UserPlus className="h-8 w-8 text-zinc-400" />
                        </div>
                        <p className="text-lg font-bold text-zinc-900 dark:text-white">No enrollments found</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Enroll students into courses to see them here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-black/5 dark:divide-white/5">
                        {filteredEnrollments.map((enrollment) => (
                            <div key={enrollment.id} className="group p-4 md:p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                
                                {/* Left: Checkbox & Student */}
                                <div className="flex items-center gap-4 flex-1 min-w-0 xl:min-w-[250px]">
                                    <Checkbox
                                        checked={selectedEnrollments.includes(enrollment.id)}
                                        onCheckedChange={() => {
                                            if (selectedEnrollments.includes(enrollment.id)) setSelectedEnrollments(selectedEnrollments.filter(id => id !== enrollment.id));
                                            else setSelectedEnrollments([...selectedEnrollments, enrollment.id]);
                                        }}
                                        className="rounded-none"
                                    />
                                    <Avatar className="h-10 w-10 rounded-none border border-black/10 dark:border-white/10">
                                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black rounded-none">
                                            {enrollment.user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-zinc-900 dark:text-white text-base truncate max-w-[200px]">
                                            {enrollment.user.name}
                                        </h4>
                                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                                            {enrollment.user.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Middle: Course & Status */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0 xl:min-w-[350px] border-y xl:border-y-0 border-black/5 dark:border-white/5 py-4 xl:py-0 xl:px-6">
                                    <div className="flex items-center gap-3 flex-1 min-w-0 xl:min-w-[200px]">
                                        <div className="h-10 w-10 shrink-0 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-none flex items-center justify-center">
                                            <PlayCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Enrolled In</span>
                                            <p className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1 max-w-[200px]" title={enrollment.course.title}>
                                                {enrollment.course.title}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <Badge variant="outline" className={cn("rounded-none uppercase tracking-widest text-[10px] px-2 py-1 border shrink-0", getStatusColor(enrollment.status))}>
                                            {enrollment.status}
                                        </Badge>

                                    </div>
                                </div>

                                {/* Right: Meta & Actions */}
                                <div className="flex items-center justify-between xl:justify-end gap-4 shrink-0 min-w-0 xl:min-w-[180px]">
                                    <div className="flex flex-col items-start xl:items-end gap-1">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Enrolled Date</span>
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                            {format(new Date(enrollment.enrolled_at), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-none border border-transparent hover:border-black/10 dark:hover:border-white/10 shrink-0 h-9 w-9">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border-black/10 dark:border-white/10 min-w-[160px]">
                                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest" onClick={() => handleUpdateStatus(enrollment, 'ACTIVE')}>
                                                <BookOpen className="h-3 w-3" /> Set Active
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-indigo-600" onClick={() => handleUpdateStatus(enrollment, 'COMPLETED')}>
                                                <TrendingUp className="h-3 w-3" /> Set Completed
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-500/10" onClick={() => handleDeleteEnrollment(enrollment)}>
                                                <Trash2 className="h-3 w-3" /> Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}