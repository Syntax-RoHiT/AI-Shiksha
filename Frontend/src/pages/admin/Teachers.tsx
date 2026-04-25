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
  UserCheck,
  BookOpen,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAdminInstructors } from "@/hooks/useAdminInstructors";
import { Users as UsersAPI } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TeachersPage() {
  const { instructors: teachers, isLoading, refetch } = useAdminInstructors();
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    avgRating: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await UsersAPI.getTeacherStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch teacher stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminDashboardLayout title="Teachers" subtitle="Manage instructors and verification requests">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Teachers</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? "..." : stats.totalTeachers.toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? "..." : stats.totalCourses.toLocaleString()}
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
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? "..." : `₹${(stats.totalRevenue / 1000000).toFixed(1)}M`}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Rating</p>
                  <p className="text-2xl font-bold">
                    {loadingStats ? "..." : stats.avgRating.toFixed(1)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-4/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Pending Verifications */}


        {/* All Teachers */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>All Teachers</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search teachers..." className="pl-9 sm:w-64 w-full" />
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
                  <TableHead>Teacher</TableHead>
                  <TableHead className="hidden sm:table-cell">Courses</TableHead>
                  <TableHead className="hidden sm:table-cell">Students</TableHead>
                  <TableHead className="hidden md:table-cell">Revenue</TableHead>
                  <TableHead className="hidden md:table-cell">Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading instructors...</TableCell></TableRow>
                ) : teachers.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">No instructors found.</TableCell></TableRow>
                ) : teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {teacher.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{teacher.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{teacher.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{teacher.courses}</TableCell>
                    <TableCell className="hidden sm:table-cell">{teacher.students.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell">₹{teacher.revenue.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {teacher.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-chart-3 text-chart-3" />
                          <span>{teacher.rating}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={teacher.status === "verified" ? "default" : "secondary"}>
                        {teacher.status || "verified"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await UsersAPI.toggleInstructorVerification(teacher.id);
                                toast.success(
                                  teacher.status === "verified"
                                    ? "Instructor unverified"
                                    : "Instructor verified successfully"
                                );
                                refetch();
                              } catch (error) {
                                toast.error("Failed to update verification status");
                              }
                            }}
                          >
                            {teacher.status === "verified" ? (
                              <><ShieldOff className="h-4 w-4 mr-2" />Unverify</>
                            ) : (
                              <><ShieldCheck className="h-4 w-4 mr-2" />Verify Instructor</>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this teacher?")) {
                                try {
                                  await UsersAPI.delete(teacher.id);
                                  toast.success("Teacher deleted successfully");
                                  refetch();
                                } catch (error) {
                                  toast.error("Failed to delete teacher");
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
    </AdminDashboardLayout>
  );
}
