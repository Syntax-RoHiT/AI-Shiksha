import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Play,
  Clock,
  BookOpen,
  CheckCircle2,
  Calendar,
  Loader2,
  ArrowRight,
  Plus,
  Users
} from "lucide-react";
import { UnifiedDashboard } from "@/components/layout/UnifiedDashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { enrollmentService, EnrolledCourse } from "@/lib/api/enrollmentService";
import { Courses } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function MyCourses() {
  const { user } = useAuth();
  
  if (user?.role === 'teacher') {
    return <TeacherCourses />;
  }
  
  return <StudentCourses />;
}

function StudentCourses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const data = await enrollmentService.getMyEnrollments();
      setCourses(data);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "in-progress") return matchesSearch && course.status !== 'completed';
    if (activeTab === "completed") return matchesSearch && course.status === 'completed';
    return matchesSearch;
  });

  return (
    <UnifiedDashboard title="My Courses" subtitle="Manage your learning journey">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8 font-sans">

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-light text-[#1F1F1F]">My Learning</h2>
            <p className="text-sm text-[#555555]">Track your progress and achievements</p>
          </div>
          <Link to="/courses">
            <Button className="bg-lms-blue hover:bg-lms-blue/90 text-white rounded-full px-6">
              Browse Catalog
            </Button>
          </Link>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent p-0 gap-1 flex-nowrap">
                <TabsTrigger value="all" className="rounded-full px-4 sm:px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-gray-500 hover:text-gray-900 transition-all whitespace-nowrap">All</TabsTrigger>
                <TabsTrigger value="in-progress" className="rounded-full px-4 sm:px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-gray-500 hover:text-gray-900 transition-all whitespace-nowrap">In Progress</TabsTrigger>
                <TabsTrigger value="completed" className="rounded-full px-4 sm:px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-gray-500 hover:text-gray-900 transition-all whitespace-nowrap">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-lms-blue/20 rounded-full"
            />
          </div>
        </div>

        {/* Course List View */}
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E1E1E1] rounded-2xl border-dashed">
            <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-[#1F1F1F]">No courses found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveTab("all") }} className="rounded-full">Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link 
                to={`/course/${course.course.slug}/view`} 
                key={course.id} 
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={(course.course.thumbnail_url && !course.course.thumbnail_url.startsWith('blob:')) ? course.course.thumbnail_url : 'https://placehold.co/1280x720?text=Course+Thumbnail'}
                    alt={course.course.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
                  {course.progress === 100 && (
                    <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-5">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                     {course.course.instructor.name}
                  </p>
                  <h3 className="font-bold text-lg text-[#1F1F1F] mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {course.course.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 mb-5 mt-auto text-xs text-gray-600 font-medium">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{course.course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{course.completedLessons}/{course.course.totalLessons}</span>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2 mt-auto">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className={course.progress === 100 ? "text-green-600" : "text-blue-600"}>
                        {course.progress === 100 ? "Ready for Certificate" : `${course.progress}% Complete`}
                      </span>
                      {course.progress > 0 && course.progress < 100 && (
                        <span className="text-gray-400 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                          Resume <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                      {course.progress === 0 && (
                        <span className="text-gray-400 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                          Start <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <Progress 
                      value={course.progress} 
                      className="h-1.5 bg-gray-100" 
                      indicatorClassName={course.progress === 100 ? "bg-green-500" : "bg-blue-600"} 
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </UnifiedDashboard>
  );
}

function TeacherCourses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await Courses.getMyCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "published") return matchesSearch && course.status === 'PUBLISHED';
    if (activeTab === "draft") return matchesSearch && (course.status === 'DRAFT' || course.status === 'PENDING_APPROVAL');
    return matchesSearch;
  });

  return (
    <UnifiedDashboard title="My Courses" subtitle="Manage courses you are teaching">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8 font-sans">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-light text-[#1F1F1F]">Course Management</h2>
            <p className="text-sm text-[#555555]">Create and manage your course catalog</p>
          </div>
          <Link to="/dashboard/courses/new">
            <Button className="bg-lms-blue hover:bg-lms-blue/90 text-white rounded-full px-6 gap-2">
              <Plus className="h-4 w-4" /> Create Course
            </Button>
          </Link>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent p-0 gap-1 flex-nowrap">
                <TabsTrigger value="all" className="rounded-full px-4 sm:px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-gray-500 hover:text-gray-900 transition-all whitespace-nowrap">All</TabsTrigger>
                <TabsTrigger value="published" className="rounded-full px-4 sm:px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-gray-500 hover:text-gray-900 transition-all whitespace-nowrap">Published</TabsTrigger>
                <TabsTrigger value="draft" className="rounded-full px-4 sm:px-6 data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white text-gray-500 hover:text-gray-900 transition-all whitespace-nowrap">Draft / Pending</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search your courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-lms-blue/20 rounded-full"
            />
          </div>
        </div>

        {/* Course List View */}
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E1E1E1] rounded-2xl border-dashed">
            <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-[#1F1F1F]">No courses found</h3>
            <p className="text-muted-foreground mb-4">You haven't created any courses matching these filters yet</p>
            {searchQuery || activeTab !== "all" ? (
                <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveTab("all") }} className="rounded-full">Clear Filters</Button>
            ) : (
                <Link to="/dashboard/courses/new">
                    <Button className="rounded-full bg-lms-blue text-white hover:bg-lms-blue/90">Create Your First Course</Button>
                </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="group bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-40 md:w-48 aspect-video sm:aspect-auto sm:h-28 md:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={((course.thumbnail || course.thumbnail_url) && !(course.thumbnail || course.thumbnail_url).startsWith('blob:')) ? (course.thumbnail || course.thumbnail_url) : 'https://placehold.co/1280x720?text=Course+Thumbnail'}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute top-2 right-2">
                    {course.status === 'PUBLISHED' && <Badge className="bg-green-500 text-white border-0 shadow-sm">Published</Badge>}
                    {course.status === 'PENDING_APPROVAL' && <Badge className="bg-yellow-500 text-white border-0 shadow-sm">Pending</Badge>}
                    {course.status === 'DRAFT' && <Badge className="bg-gray-500 text-white border-0 shadow-sm">Draft</Badge>}
                    {course.status === 'REJECTED' && <Badge className="bg-red-500 text-white border-0 shadow-sm">Rejected</Badge>}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center min-w-0 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-[#1F1F1F] mb-1 group-hover:text-lms-blue transition-colors truncate">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {course.subtitle || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-3 text-xs text-black font-medium">
                    <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md">
                      <Users className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-gray-700">{course.enrollments?.length || 0} Students</span>
                    </div>
                    {course.category && (
                        <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md">
                        <BookOpen className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-700">{course.category.name}</span>
                        </div>
                    )}
                  </div>
                </div>

                {/* Progress & Action */}
                <div className="w-full sm:w-40 md:w-48 flex-shrink-0 flex flex-row sm:flex-col gap-2 sm:gap-3 justify-start sm:justify-center">
                    <Link to={`/dashboard/courses/${course.id}/edit`} className="w-full">
                        <Button variant="outline" className="w-full rounded-full border-gray-200 hover:border-lms-blue hover:text-lms-blue group-hover:border-lms-blue group-hover:text-lms-blue transition-all">
                            Edit Course
                        </Button>
                    </Link>
                    <Link to={`/dashboard/courses/${course.id}/preview`} className="w-full">
                        <Button variant="ghost" className="w-full rounded-full text-gray-500 hover:text-gray-900 transition-all">
                            Preview
                        </Button>
                    </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UnifiedDashboard>
  );
}
