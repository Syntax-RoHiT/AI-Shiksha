import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  BookOpen,
  PlayCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CourseApproval } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface PendingCourse {
  id: string;
  title: string;
  instructor: {
    user: {
      name: string;
      email: string;
    };
  };
  category?: {
    name: string;
  };
  sections: any[];
  status: string;
  submitted_for_approval_at: string;
  price: number;
}

export default function CourseApprovalPage() {
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<PendingCourse | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  const loadPendingCourses = async () => {
    try {
      setLoading(true);
      const data = await CourseApproval.getPending();
      setCourses(data);
    } catch (error) {
      console.error("Failed to load pending courses:", error);
      toast({
        title: "Error",
        description: "Failed to load pending courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingCourses();
  }, []);

  const handleApprove = async (courseId: string) => {
    setActionLoading(courseId);
    try {
      await CourseApproval.approve(courseId);
      toast({
        title: "Course Approved",
        description: "The course has been approved and published successfully.",
      });
      await loadPendingCourses();
    } catch (error: any) {
      console.error("Failed to approve course:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve course",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (course: PendingCourse) => {
    setSelectedCourse(course);
    setRejectDialogOpen(true);
    setRejectionReason("");
  };

  const handleRejectSubmit = async () => {
    if (!selectedCourse || !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this course.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(selectedCourse.id);
    try {
      await CourseApproval.reject(selectedCourse.id, rejectionReason);
      toast({
        title: "Course Rejected",
        description: "The instructor will be notified of the rejection.",
      });
      setRejectDialogOpen(false);
      setSelectedCourse(null);
      setRejectionReason("");
      await loadPendingCourses();
    } catch (error: any) {
      console.error("Failed to reject course:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject course",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const calculateLessonCount = (course: PendingCourse) => {
    return course.sections?.reduce((total, section) => {
      return total + (section.items?.length || 0);
    }, 0) || 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <AdminDashboardLayout title="Course Approval" subtitle="Review and approve pending courses">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout title="Course Approval" subtitle="Review and approve pending courses">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{courses.length}</p>
                </div>
                <Clock className="h-8 w-8 text-chart-3/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Awaiting Action</p>
                  <p className="text-2xl font-bold">{courses.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sections</p>
                  <p className="text-2xl font-bold">
                    {courses.reduce((sum, c) => sum + (c.sections?.length || 0), 0)}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Lessons</p>
                  <p className="text-2xl font-bold">
                    {courses.reduce((sum, c) => sum + calculateLessonCount(c), 0)}
                  </p>
                </div>
                <PlayCircle className="h-8 w-8 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Courses ({courses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {courses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    There are no courses pending approval at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              courses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Course Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="h-20 w-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <PlayCircle className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{course.title}</h3>
                              {course.category && (
                                <Badge variant="secondary">{course.category.name}</Badge>
                              )}
                              <Badge variant={course.price === 0 ? "default" : "outline"}>
                                {course.price === 0 ? "Free" : `₹${course.price}`}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {course.instructor.user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span>{course.instructor.user.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" /> {course.sections?.length || 0}{" "}
                                sections
                              </span>
                              <span className="flex items-center gap-1">
                                <PlayCircle className="h-4 w-4" /> {calculateLessonCount(course)}{" "}
                                lessons
                              </span>
                              <span>
                                Submitted:{" "}
                                {course.submitted_for_approval_at
                                  ? formatDate(course.submitted_for_approval_at)
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 lg:flex-col">
                        <Link to={`/dashboard/courses/${(course as any).slug || course.id}/preview`} target="_blank" className="flex-1 lg:flex-none">
                          <Button variant="outline" size="sm" className="gap-1 w-full">
                            <Eye className="h-4 w-4" /> Preview
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700 text-white flex-1 lg:flex-none"
                          onClick={() => handleApprove(course.id)}
                          disabled={actionLoading === course.id}
                        >
                          {actionLoading === course.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1 flex-1 lg:flex-none"
                          onClick={() => handleRejectClick(course)}
                          disabled={actionLoading === course.id}
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Course</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting "{selectedCourse?.title}". The instructor
                will be notified with your feedback.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Content quality issues, incomplete sections, missing resources..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || actionLoading === selectedCourse?.id}
              >
                {actionLoading === selectedCourse?.id && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reject Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}
