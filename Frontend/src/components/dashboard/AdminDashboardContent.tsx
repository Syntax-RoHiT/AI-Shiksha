import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Shield,
  GraduationCap,
  UserCog,
  Search,
  ArrowUpRight,
  Plus,
  Clock,
  ChevronRight,
  Settings,
  Bell,
  Activity,
  ArrowRight
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import * as LucideIcons from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function AdminDashboardContent() {
  const navigate = useNavigate();
  const { stats, pendingActions: apiPendingActions, isLoading } = useAdminDashboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const quickActions = [
    { label: "Manage Users", icon: Users, href: "/dashboard/users", gradient: "from-blue-500 to-cyan-400", shadow: "shadow-blue-500/20" },
    { label: "Manage Courses", icon: BookOpen, href: "/dashboard/courses", gradient: "from-indigo-500 to-purple-500", shadow: "shadow-indigo-500/20" },
    { label: "Transactions", icon: DollarSign, href: "/dashboard/transactions", gradient: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-500/20" },
    { label: "Manage Teachers", icon: GraduationCap, href: "/dashboard/teachers", gradient: "from-violet-500 to-fuchsia-500", shadow: "shadow-violet-500/20" },
    { label: "Manage Students", icon: UserCog, href: "/dashboard/students", gradient: "from-teal-400 to-emerald-400", shadow: "shadow-teal-500/20" },
    { label: "Approvals", icon: CheckCircle, href: "/dashboard/course-approval", gradient: "from-amber-400 to-orange-500", shadow: "shadow-amber-500/20" },
    { label: "Support Tickets", icon: AlertTriangle, href: "/dashboard/tickets", gradient: "from-rose-400 to-red-500", shadow: "shadow-rose-500/20" },
    { label: "SEO Config", icon: Search, href: "/dashboard/seo-settings", gradient: "from-orange-400 to-amber-500", shadow: "shadow-orange-500/20" },
    { label: "Platform Setup", icon: Settings, href: "/dashboard/platform-settings", gradient: "from-slate-600 to-slate-800", shadow: "shadow-slate-500/20" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-t-2 border-primary animate-spin"></div>
          <div className="absolute inset-2 border-r-2 border-emerald-500 animate-spin opacity-70" style={{ animationDuration: '1.5s' }}></div>
        </div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest animate-pulse">Initializing Mission Control...</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8 max-w-[1600px] mx-auto pb-12 transition-all duration-700 ease-out", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>

      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-none bg-zinc-950 p-8 md:p-12 shadow-2xl border border-white/10 group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-emerald-500/20 opacity-50 transition-opacity duration-1000 group-hover:opacity-70"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/30 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Mission Control
            </h2>
            <p className="text-sm md:text-lg text-white/60 font-medium max-w-xl">
              Monitor your franchise metrics, manage enrollments, and oversee platform activity in real-time.
            </p>
          </div>
          <Link to="/dashboard/courses/new" className="shrink-0">
            <Button className="gap-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-none shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-300 px-8 h-14 border-0">
              <Plus className="h-5 w-5" />
              <span className="font-bold tracking-wide text-sm uppercase">Create Course</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Glass Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats?.map((stat, i) => {
          const IconComponent = (LucideIcons as any)[stat.icon] || LucideIcons.HelpCircle;
          return (
            <div 
              key={stat.label} 
              className="relative group rounded-none bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative p-6 sm:p-8 flex flex-col h-full z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-none flex items-center justify-center shadow-sm bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                    <IconComponent className={cn("h-6 w-6", stat.iconColor)} />
                  </div>
                  <Badge variant="outline" className="text-xs font-bold rounded-none bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-900 dark:text-white border-black/10 dark:border-white/10 gap-1 px-3 py-1 shadow-sm uppercase tracking-widest">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-auto space-y-1">
                  <p className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{stat.value}</p>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Modern Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-none bg-zinc-900 dark:bg-white flex items-center justify-center shadow-md">
              <Shield className="h-5 w-5 text-white dark:text-zinc-900" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Administrative Toolkit</h3>
          </div>
          
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-black/5 dark:border-white/5 rounded-none p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href}>
                <div className="group relative flex flex-col items-center justify-center gap-4 p-6 h-full rounded-none bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 hover:border-transparent transition-all duration-300 cursor-pointer overflow-hidden z-0">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}></div>
                  
                  <div className={`w-14 h-14 rounded-none bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-lg ${action.shadow} group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-sm text-center text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors tracking-wide">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Priority Inbox */}
        <div className="space-y-6 flex flex-col h-full">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Action Required</h3>
            </div>
            <Badge className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-none px-3 py-1 shadow-md font-black text-sm">
              {apiPendingActions?.length || 0}
            </Badge>
          </div>

          <div className="flex-1 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 h-[400px] p-2">
              {apiPendingActions && apiPendingActions.length > 0 ? (
                <div className="flex flex-col gap-2 p-2">
                  {apiPendingActions.map((action, index) => (
                    <Link key={index} to={action.href} className="group relative flex items-start gap-4 p-5 rounded-none bg-white dark:bg-zinc-950 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-md">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${action.priority === "high" ? "bg-rose-500" : "bg-amber-500"}`}></div>
                      <div className={`mt-0.5 h-12 w-12 shrink-0 rounded-none flex items-center justify-center shadow-inner ${action.priority === "high" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                        {action.priority === "high" ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 pr-4">
                          {action.title}
                        </p>
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                          {action.priority === 'high' ? 'Urgent Review' : 'Pending Request'}
                        </p>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
                         <div className="w-8 h-8 rounded-none bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <ArrowRight className="h-4 w-4 text-zinc-900 dark:text-white" />
                         </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground p-8 text-center min-h-[300px]">
                  <div className="w-20 h-20 rounded-none bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-2">
                     <CheckCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <p className="text-base font-bold text-zinc-900 dark:text-white">You're all caught up!</p>
                  <p className="text-sm font-medium">No pending actions require your attention.</p>
                </div>
              )}
            </ScrollArea>
            <div className="p-4 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md border-t border-black/5 dark:border-white/5 rounded-none">
              <Button variant="ghost" className="w-full rounded-none font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 h-12" onClick={() => navigate('/dashboard/tickets')}>
                View All Communications
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}