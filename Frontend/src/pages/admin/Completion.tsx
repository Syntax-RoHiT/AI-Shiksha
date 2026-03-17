import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Award,
  TrendingUp,
  Users,
  CheckCircle,
  Loader2,
  MoreHorizontal,
  Filter,
  X,
  Calendar,
} from "lucide-react";
import { Enrollments, Completions } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Enrollment {
  id: string; // The enrollment ID
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  course: {
    id: string;
    title: string;
  };
  enrolled_at: string;
  status: 'active' | 'completed' | 'cancelled';
  progress_percentage: number;
  completed_at?: string;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  thisMonth: number;
  growth: number;
}

export default function CompletionPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  // Edit Dates State
  const [detailOpen, setDetailOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [incompleteOpen, setIncompleteOpen] = useState(false);
  const [editEnrollmentDate, setEditEnrollmentDate] = useState("");
  const [editCompletionDate, setEditCompletionDate] = useState("");

  useEffect(() => {
    loadData();
  }, [statusFilter]); // Reload when status filter changes

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, enrollmentsData] = await Promise.all([
        Enrollments.getStats(),
        Enrollments.getAll(search, statusFilter === "all" ? undefined : statusFilter),
      ]);
      setStats(statsData);
      setEnrollments(enrollmentsData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load enrollments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEnrollments(enrollments.map(e => e.id));
    } else {
      setSelectedEnrollments([]);
    }
  };

  const handleSelectEnrollment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEnrollments(prev => [...prev, id]);
    } else {
      setSelectedEnrollments(prev => prev.filter(eid => eid !== id));
    }
  };

  const handleBulkComplete = async () => {
    if (selectedEnrollments.length === 0) return;

    try {
      setProcessing(true);
      const res = await Enrollments.bulkComplete(selectedEnrollments);
      toast({
        title: "Success",
        description: res.message,
      });
      setSelectedEnrollments([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to mark as complete",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveDates = async () => {
    try {
      setProcessing(true);
      const res = await Enrollments.bulkUpdateDates(
        selectedEnrollments,
        editEnrollmentDate || undefined,
        editCompletionDate || undefined
      );
      toast({ title: "Success", description: res.message });
      setDatesOpen(false);
      setEditEnrollmentDate("");
      setEditCompletionDate("");
      setSelectedEnrollments([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update dates",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkIncomplete = async () => {
    try {
      setProcessing(true);
      const res = await Enrollments.bulkIncomplete(selectedEnrollments);
      toast({ title: "Success", description: res.message });
      setIncompleteOpen(false);
      setSelectedEnrollments([]);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to mark incomplete",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openEditDates = (id?: string) => {
    if (id) setSelectedEnrollments([id]);
    setEditEnrollmentDate("");
    setEditCompletionDate("");
    setDatesOpen(true);
  };

  const openMarkIncomplete = (id?: string) => {
    if (id) setSelectedEnrollments([id]);
    setIncompleteOpen(true);
  };

  const handleManualComplete = async (enrollmentId: string) => {
    try {
      setProcessing(true);
      await Enrollments.manualComplete(enrollmentId);
      toast({
        title: "Success",
        description: "Enrollment marked as complete",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to complete enrollment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const completedRate = stats ? Math.round((stats.completed / (stats.total || 1)) * 100) : 0;

  return (
    <AdminDashboardLayout title="Enrollments & Completions" subtitle="Track progress and manage student completions">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Enrollments</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                  <p className="text-2xl font-bold">{stats?.active || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{completedRate}%</p>
                </div>
                <Award className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Student Enrollments</CardTitle>
                <Badge variant="outline" className="text-muted-foreground font-normal">
                  {enrollments.length} found
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student or course..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                {/* Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleSearch} variant="secondary">
                  Search
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Bulk Actions Toolbar */}
            {selectedEnrollments.length > 0 && (
              <div className="flex items-center justify-between p-3 mb-4 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-medium">
                  {selectedEnrollments.length} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDates()}
                    disabled={processing}
                    className="gap-2 bg-background"
                  >
                    <Calendar className="h-4 w-4" />
                    Edit Dates
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openMarkIncomplete()}
                    disabled={processing}
                    className="gap-2 bg-background text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <TrendingUp className="h-4 w-4 rotate-180" />
                    Reset Progress
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkComplete}
                    disabled={processing}
                    className="gap-2"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Mark Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedEnrollments([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={enrollments.length > 0 && selectedEnrollments.length === enrollments.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Loading enrollments...</p>
                      </TableCell>
                    </TableRow>
                  ) : enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No enrollments found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedEnrollments.includes(enrollment.id)}
                            onCheckedChange={(checked) => handleSelectEnrollment(enrollment.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={enrollment.user.avatar_url} />
                              <AvatarFallback>
                                {enrollment.user.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{enrollment.user.name}</p>
                              <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm max-w-[200px] truncate" title={enrollment.course.title}>
                            {enrollment.course.title}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(enrollment.enrolled_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {enrollment.status === 'completed' || enrollment.progress_percentage === 100 ? (
                            <div className="font-medium text-green-700">
                              {enrollment.completed_at ? format(new Date(enrollment.completed_at), "MMM d, yyyy") : "Completed"}
                            </div>
                          ) : (
                            <div className="w-[140px] space-y-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">{enrollment.progress_percentage}%</span>
                              </div>
                              <Progress value={enrollment.progress_percentage} className="h-2" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {enrollment.status === 'completed' ? (
                            <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">
                              Completed
                            </Badge>
                          ) : enrollment.status === 'active' ? (
                            <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/5">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {enrollment.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {enrollment.status !== 'completed' && (
                                <DropdownMenuItem onClick={() => handleManualComplete(enrollment.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  Mark as Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openEditDates(enrollment.id)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Edit Dates
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openMarkIncomplete(enrollment.id)}
                                className="text-orange-600 focus:text-orange-700"
                              >
                                <TrendingUp className="h-4 w-4 mr-2 rotate-180" />
                                Reset Progress
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dates Dialog */}
        <Dialog open={datesOpen} onOpenChange={setDatesOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Dates</DialogTitle>
              <DialogDescription>
                Update enrollment and completion dates for {selectedEnrollments.length} student(s).
                Leave blank to keep existing dates.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="enrolledDate" className="text-right">
                  Enrolled
                </Label>
                <Input
                  id="enrolledDate"
                  type="date"
                  className="col-span-3"
                  value={editEnrollmentDate}
                  onChange={(e) => setEditEnrollmentDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="completedDate" className="text-right">
                  Completed
                </Label>
                <Input
                  id="completedDate"
                  type="date"
                  className="col-span-3"
                  value={editCompletionDate}
                  onChange={(e) => setEditCompletionDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDatesOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveDates} disabled={processing}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mark Incomplete Confirmation Dialog */}
        <Dialog open={incompleteOpen} onOpenChange={setIncompleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reset Progress?</DialogTitle>
              <DialogDescription>
                Are you sure you want to reset progress for {selectedEnrollments.length} student(s)?
                This will set progress to 0%, mark status as Active, and delete any issued certificates.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIncompleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleMarkIncomplete} disabled={processing}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reset Progress
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminDashboardLayout>
  );
}