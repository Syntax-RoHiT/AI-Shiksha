import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  MoreHorizontal,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Mail,
} from "lucide-react";
import { UnifiedDashboard } from "@/components/layout/UnifiedDashboard";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useUsers } from "@/hooks/useUsers";
import { Users as UsersAPI, Instructors } from "@/lib/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteUser } from "@/hooks/useUsers";

export default function StudentsPage() {
  const { user } = useAuth();
  
  if (user?.role === 'teacher') {
    return <TeacherStudents />;
  }
  
  return <AdminStudents />;
}

function AdminStudents() {
  const { user } = useAuth();
  const { users: students, isLoading } = useUsers("student");
  const { mutateAsync: deleteUser } = useDeleteUser();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    avgCompletion: 0,
    newThisMonth: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await UsersAPI.getStudentStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch student stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);


  const content = (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "..." : stats.totalStudents.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Learners</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "..." : stats.activeStudents.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Completion</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "..." : `${stats.avgCompletion}%`}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "..." : `+${stats.newThisMonth.toLocaleString()}`}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-chart-4/20 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Students</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-9 sm:w-64 w-full" />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading students...</TableCell></TableRow>
              ) : students.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center">No students found.</TableCell></TableRow>
              ) : students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{student.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(student.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete this student?")) {
                              try {
                                await deleteUser(student.id);
                                toast.success("Student deleted successfully");
                              } catch (error) {
                                toast.error("Failed to delete student");
                              }
                            }
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const isAdminRole = ["admin", "super_admin", "franchise_admin"].includes(user?.role?.toLowerCase() || "");

  if (isAdminRole) {
    return (
      <AdminDashboardLayout title="Students" subtitle="Manage student accounts and enrollments">
        {content}
      </AdminDashboardLayout>
    );
  }

  return (
    <UnifiedDashboard title="Students" subtitle="Manage enrolled students">
      {content}
    </UnifiedDashboard>
  );
}

function TeacherStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await Instructors.getStudents();
        setStudents(data);
      } catch (error) {
        console.error("Failed to fetch instructor students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <UnifiedDashboard title="My Students" subtitle="Manage students enrolled in your courses">
      <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-light text-[#1F1F1F]">Enrolled Students</h2>
            <p className="text-sm text-[#555555]">View progress and engagement for your learners</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search students or courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-lms-blue/20 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="py-4">Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Enrolled Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading students...</TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students found matching your criteria.</TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student: any, idx: number) => (
                  <TableRow key={`${student.id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                            <AvatarImage src={student.avatar} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{student.name}</span>
                            <span className="text-xs text-gray-500">{student.email}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">{student.courseTitle}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{student.progress}%</span>
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-lms-blue transition-all" 
                                style={{ width: `${student.progress}%` }}
                            />
                        </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                        {new Date(student.enrolledAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                          student.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                          student.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                      }>
                        {student.status?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </UnifiedDashboard>
  );
}
