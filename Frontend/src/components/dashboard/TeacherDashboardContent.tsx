import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, TrendingUp, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useInstructorDashboard } from "@/hooks/useInstructorDashboard";
import * as LucideIcons from "lucide-react";

export function TeacherDashboardContent() {
  const { user } = useAuth();
  const { data, isLoading } = useInstructorDashboard();

  if (isLoading) {
    return <div className="p-4 md:p-8 text-center text-muted-foreground animate-pulse font-medium">Loading dashboard data...</div>;
  }

  const { stats, topCourses, recentStudents } = data || { stats: [], topCourses: [], recentStudents: [] };

  return (
    <div className="space-y-5 md:space-y-6 lg:space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 to-primary/5 p-4 sm:p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">Welcome back, {user?.name}!</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Here's what is happening with your courses today.</p>
        </div>
        <Link to="/dashboard/courses/new" className="relative z-10 self-start sm:self-auto">
          <Button className="bg-primary hover:bg-primary/90 gap-2 shadow-sm rounded-full px-5 sm:px-6">
            <Plus className="h-4 w-4" />
            <span>Create New Course</span>
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats?.map((stat) => {
          const IconComponent = (LucideIcons as any)[stat.icon] || LucideIcons.HelpCircle;
          return (
            <Card key={stat.label} className={`border-none shadow-sm bg-gradient-to-br ${stat.gradient} overflow-hidden group`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-full bg-white/50 dark:bg-black/20 ${stat.iconColor} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  {stat.change && (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-xs md:text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg tracking-tight text-foreground">Top Performing Courses</h3>
            <Link to="/dashboard/my-courses" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {topCourses.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No published courses available.</div>
                ) : (
                  topCourses.map((course, index) => (
                    <div key={index} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                      <div className="h-10 w-10 bg-primary/10 flex items-center justify-center text-sm font-bold text-primary rounded-full shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/dashboard/courses/${course.slug}/preview`} className="font-medium text-foreground text-sm hover:text-primary transition-colors truncate block">
                          {course.title}
                        </Link>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 font-medium">
                          <span>{course.students} students</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {course.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recently Enrolled Students */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg tracking-tight text-foreground">Recently Enrolled Students</h3>
            <Link to="/dashboard/students" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Card className="border shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentStudents.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No recent enrollments.</div>
                ) : (
                  recentStudents.map((student, index) => (
                    <div key={index} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                      <Avatar className="h-10 w-10 shadow-sm border border-border/50">
                        <AvatarImage src={student.avatar_url || ''} alt={student.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground truncate font-medium">{student.course}</p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-1 rounded-md">
                        {new Date(student.enrolled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
