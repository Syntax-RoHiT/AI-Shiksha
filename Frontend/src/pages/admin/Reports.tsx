import { useState, useEffect, useRef } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  Download,
  FileSpreadsheet,
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  Loader2,
  Activity,
  CheckCircle2,
  PlayCircle,
  HelpCircle,
  FileText,
  Clock,
  CreditCard,
  XCircle,
  Tag,
} from "lucide-react";
import { Reports } from "@/lib/api";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("students");
  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const fetchReport = async () => {
    setLoading(true);
    setData(null);
    const requestingTab = activeTabRef.current;
    try {
      const params = {
        startDate: date.from ? date.from.toISOString() : undefined,
        endDate: date.to ? date.to.toISOString() : undefined,
      };

      let res;
      switch (activeTab) {
        case "students":
          res = await Reports.getStudents(params);
          break;
        case "courses":
          res = await Reports.getCourses(params);
          break;
        case "assessments":
          res = await Reports.getAssessments(params);
          break;
        case "revenue":
          res = await Reports.getRevenue(params);
          break;
      }
      
      // Only update state if the user hasn't switched tabs while fetching
      if (activeTabRef.current === requestingTab) {
        setData(res);
      }
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, date]);

  const exportCSV = () => {
    if (!data) return;
    let exportData: any[] = [];
    let filename = `${activeTab}_report_${format(new Date(), "yyyy-MM-dd")}.csv`;

    switch (activeTab) {
      case "students":
        exportData = data.students;
        break;
      case "courses":
        exportData = data.courses.map((c: any) => ({
          "Course ID": c.courseId,
          "Course Name": c.courseName,
          "Total Enrollments": c.totalEnrollments,
          "Completion Rate": `${c.completionRate}%`,
          "Lecture Completion": `${c.lectureCompletionPct}%`,
        }));
        break;
      case "assessments":
        exportData = [
          ...data.quizSubmissions.map((q: any) => ({
            Type: "Quiz",
            Student: q.studentName,
            Email: q.studentEmail,
            Assessment: q.quizTitle,
            Score: q.score,
            Status: q.passed ? "Passed" : "Failed",
            Date: q.submittedAt,
          })),
          ...data.assignmentSubmissions.map((a: any) => ({
            Type: "Assignment",
            Student: a.studentName,
            Email: a.studentEmail,
            Assessment: a.assignmentTitle,
            Score: a.grade || "Pending",
            Status: a.graded ? "Graded" : "Pending",
            Date: a.submittedAt,
          })),
        ];
        break;
      case "revenue":
        exportData = data.transactions;
        break;
    }

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    if (!data) return;
    let exportData: any[] = [];
    let filename = `${activeTab}_report_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

    switch (activeTab) {
      case "students":
        exportData = data.students;
        break;
      case "courses":
        exportData = data.courses.map((c: any) => ({
          "Course ID": c.courseId,
          "Course Name": c.courseName,
          "Total Enrollments": c.totalEnrollments,
          "Completion Rate": c.completionRate / 100,
          "Lecture Completion": c.lectureCompletionPct / 100,
        }));
        break;
      case "assessments":
        exportData = [
          ...data.quizSubmissions.map((q: any) => ({
            Type: "Quiz",
            Student: q.studentName,
            Email: q.studentEmail,
            Assessment: q.quizTitle,
            Score: q.score,
            Status: q.passed ? "Passed" : "Failed",
            Date: new Date(q.submittedAt),
          })),
          ...data.assignmentSubmissions.map((a: any) => ({
            Type: "Assignment",
            Student: a.studentName,
            Email: a.studentEmail,
            Assessment: a.assignmentTitle,
            Score: a.grade || "Pending",
            Status: a.graded ? "Graded" : "Pending",
            Date: new Date(a.submittedAt),
          })),
        ];
        break;
      case "revenue":
        exportData = data.transactions.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }));
        break;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, filename);
  };

  const renderKPIs = () => {
    if (!data || !data.summary) return null;

    let kpis = [];
    switch (activeTab) {
      case "students":
        kpis = [
          { title: "Total Students", value: data.summary.totalStudents, icon: Users },
          { title: "New Registrations", value: data.summary.newRegistrations, icon: Users },
          { title: "Active Students", value: data.summary.activeStudents, icon: Activity },
          { title: "Avg Courses/Student", value: data.summary.avgCoursesPerStudent, icon: BookOpen },
        ];
        break;
      case "courses":
        kpis = [
          { title: "Total Enrollments", value: data.summary.totalEnrollments, icon: Users },
          { title: "Active Courses", value: data.summary.activeCourses, icon: BookOpen },
          { title: "Avg Completion Rate", value: `${data.summary.avgCompletionRate}%`, icon: CheckCircle2 },
          { title: "Avg Lecture Completion", value: `${data.summary.avgLectureCompletion}%`, icon: PlayCircle },
        ];
        break;
      case "assessments":
        kpis = [
          { title: "Quiz Attempts", value: data.summary.totalQuizAttempts, icon: HelpCircle },
          { title: "Pass Rate", value: `${data.summary.passRate}%`, icon: CheckCircle2 },
          { title: "Submissions", value: data.summary.assignmentSubmissions, icon: FileText },
          { title: "Pending Eval", value: data.summary.pendingEvaluations, icon: Clock },
        ];
        break;
      case "revenue":
        kpis = [
          { title: "Total Revenue", value: `₹${data.summary.totalRevenue?.toLocaleString() ?? 0}`, icon: DollarSign },
          { title: "Transactions", value: data.summary.totalTransactions, icon: CreditCard },
          { title: "Failed Payments", value: data.summary.failedPayments, icon: XCircle },
          { title: "Coupon Usage", value: data.summary.couponUsage, icon: Tag },
        ];
        break;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map((kpi, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderChartsAndTables = () => {
    switch (activeTab) {
      case "students":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Students by Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.studentsByCourse} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="courseName" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Enrolled At</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.students.slice(0, 10).map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{s.course}</TableCell>
                          <TableCell>{format(new Date(s.enrolledAt), "PPp")}</TableCell>
                          <TableCell className="capitalize">{s.status.toLowerCase()}</TableCell>
                        </TableRow>
                      ))}
                      {data.students.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No students found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "courses":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Completion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.courses} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="courseName" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                      <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Legend />
                      <Bar dataKey="completionRate" name="Course Completion" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lectureCompletionPct" name="Lecture Completion" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Enrollments</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead>Lecture Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.courses.map((c: any) => (
                        <TableRow key={c.courseId}>
                          <TableCell className="font-medium">{c.courseName}</TableCell>
                          <TableCell>{c.totalEnrollments}</TableCell>
                          <TableCell>{c.completionRate}%</TableCell>
                          <TableCell>{c.lectureCompletionPct}%</TableCell>
                        </TableRow>
                      ))}
                      {data.courses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No courses found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "assessments":
        const pieData = [
          { name: 'Passed', value: data.summary.passRate, fill: '#10b981' },
          { name: 'Failed', value: data.summary.failRate, fill: '#ef4444' }
        ];

        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Pass Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {data.summary.totalQuizAttempts > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">No quiz attempts yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Quiz Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto max-h-[250px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Quiz</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.quizSubmissions.slice(0, 5).map((q: any) => (
                          <TableRow key={q.id}>
                            <TableCell>{q.studentName}</TableCell>
                            <TableCell>{q.quizTitle}</TableCell>
                            <TableCell>{q.score}%</TableCell>
                            <TableCell>
                              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", q.passed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                                {q.passed ? 'Passed' : 'Failed'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Assignment Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.assignmentSubmissions.slice(0, 10).map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.studentName}</TableCell>
                          <TableCell>{a.assignmentTitle}</TableCell>
                          <TableCell>{a.courseName}</TableCell>
                          <TableCell>{format(new Date(a.submittedAt), "PPp")}</TableCell>
                          <TableCell>
                            {a.graded ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Graded ({a.grade}/100)</span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">Pending Eval</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.assignmentSubmissions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No assignments found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.courseSales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="courseName" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(val: number) => `₹${val}`} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Bar dataKey="revenue" name="Revenue Generated" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.transactions.slice(0, 10).map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{t.studentName}</p>
                              <p className="text-xs text-muted-foreground">{t.studentEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>{t.course}</TableCell>
                          <TableCell className="font-medium">₹{t.amount.toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(t.createdAt), "PPp")}</TableCell>
                          <TableCell>
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", 
                              t.status === 'success' || t.status === 'completed' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                              t.status === 'failed' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>
                              {t.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.transactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No transactions found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminDashboardLayout title="Reports & Analytics">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="students" className="gap-2">
                <Users className="h-4 w-4" />
                Students
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="assessments" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Assessments
              </TabsTrigger>
              <TabsTrigger value="revenue" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[260px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate as any}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button onClick={exportCSV} variant="outline" disabled={!data || loading}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button onClick={exportExcel} variant="outline" disabled={!data || loading}>
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
              Excel
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <>
            {renderKPIs()}
            {renderChartsAndTables()}
          </>
        ) : null}
      </div>
    </AdminDashboardLayout>
  );
}
