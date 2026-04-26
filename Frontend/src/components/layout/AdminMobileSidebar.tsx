import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Brain,
  DollarSign,
  BarChart3,
  MessageSquare,
  Shield,
  Settings,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  HelpCircle,
  Activity,
  UserCheck,
  UserCog,
  Lock,
  Folder,
  FileCheck,
  AlertCircle,
  Bot,
  Sparkles,
  Zap,
  TrendingUp,
  CreditCard,
  Receipt,
  Wallet,
  Tag,
  Crown,
  FileText,
  Download,
  Building2,
  Globe,
  Megaphone,
  Ticket,
  MessagesSquare,
  History,
  AlertTriangle,
  Database,
  Palette,
  Mail,
  Link2,
  Bell,
  Key,
  Webhook,
  ScrollText,
  Flag,
  Server,
  HardDrive,
  User,
  Search,
  Plus,
  Award,
  CheckSquare,
  Landmark,
  PanelBottom,
} from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useFranchise } from "@/contexts/FranchiseContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SheetClose } from "@/components/ui/sheet";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  children?: NavItem[];
  badge?: string;
  badgeColor?: string;
}

const adminNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: Users,
    label: "User Management",
    children: [
      { icon: Users, label: "All Users", href: "/dashboard/users" },
      { icon: GraduationCap, label: "Students", href: "/dashboard/students" },
      { icon: UserCheck, label: "Teachers", href: "/dashboard/teachers" },
    ],
  },
  {
    icon: BookOpen,
    label: "Course Management",
    children: [
      { icon: BookOpen, label: "All Courses", href: "/dashboard/courses" },
      { icon: FileText, label: "Assignments", href: "/dashboard/assignments" },
      { icon: HelpCircle, label: "Quizzes", href: "/dashboard/quizzes" },
      { icon: MessagesSquare, label: "Q/A", href: "/dashboard/qa" },
      { icon: Plus, label: "Add Course", href: "/dashboard/courses/new" },
      { icon: Folder, label: "Categories", href: "/dashboard/categories" },
      { icon: UserCog, label: "Enrollment", href: "/dashboard/enrollment" },
      { icon: Award, label: "Certificate Templates", href: "/dashboard/certificate-templates" },
      { icon: CheckSquare, label: "Completion", href: "/dashboard/completion" },
      { icon: FileCheck, label: "Course Approval", href: "/dashboard/course-approval" },
      { icon: ScrollText, label: "Terms & Conditions", href: "/dashboard/system-settings/terms" },
    ],
  },
  {
    icon: DollarSign,
    label: "Payments",
    children: [
      { icon: CreditCard, label: "Razorpay", href: "/dashboard/payments/razorpay" },
      { icon: Receipt, label: "Transactions", href: "/dashboard/payments/transactions" },
      { icon: Tag, label: "Coupons", href: "/dashboard/coupons" },
    ]
  },
  {
    icon: Bot,
    label: "Ai Control Center",
    href: "/dashboard/ai-control",
  },
  {
    icon: Building2,
    label: "Franchise",
    href: "/dashboard/franchises",
  },
  {
    icon: Building2,
    label: "Franchise Settings",
    href: "/dashboard/franchises",
  },
  {
    icon: MessageSquare,
    label: "Communication",
    children: [
      { icon: Megaphone, label: "Announcements", href: "/dashboard/announcements" },
      { icon: MessageSquare, label: "Student Feedback", href: "/dashboard/feedback" },
      { icon: Ticket, label: "Support Tickets", href: "/dashboard/tickets" },
    ],
  },
  {
    icon: Shield,
    label: "Security",
    href: "/dashboard/security",
  },
  {
    icon: Settings,
    label: "Settings",
    children: [
      { icon: Palette, label: "Platform", href: "/dashboard/platform-settings" },
      { icon: Search, label: "SEO Settings", href: "/dashboard/seo-settings" },
    ],
  },
  {
    icon: FileText,
    label: "Policy Pages",
    href: "/dashboard/policy-pages",
  },
  {
    icon: PanelBottom,
    label: "Footer Settings",
    href: "/dashboard/footer-settings",
  },
  {
    icon: User,
    label: "Profile Settings",
    href: "/dashboard/settings",
  },
];

const bottomNavItems: NavItem[] = [
  { icon: HelpCircle, label: "Help & Docs", href: "/dashboard/help" },
  { icon: Server, label: "System Status", href: "/dashboard/system-status" },
];

export function AdminMobileSidebar() {
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setMobileOpen } = useSidebarContext();
  const { branding } = useFranchise();

  if (!user) return null;

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/dashboard") return location.pathname === href;

    // Special case for "Add Course" - highlight when in course builder (edit mode)
    if (href === "/dashboard/courses/new" && location.pathname.match(/\/dashboard\/courses\/[^/]+\/edit/)) {
      return true;
    }

    // Prevent "All Courses" from being active when "Add Course" is active
    if (href === "/dashboard/courses" && (location.pathname === "/dashboard/courses/new" || location.pathname.match(/\/dashboard\/courses\/[^/]+\/edit/))) {
      return false;
    }

    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileOpen(false);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[hsl(220,50%,15%)] to-[hsl(220,50%,12%)]">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent overflow-hidden">
          {branding.favicon_url || branding.logo_url ? (
            <img src={getImageUrl((branding.favicon_url || branding.logo_url) as string)} alt={branding.lms_name} className="h-9 w-9 object-cover" />
          ) : (
            <GraduationCap className="h-5 w-5 text-white" />
          )}
        </div>
        <div>
          <span className="font-bold text-white">{branding.lms_name}</span>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {adminNavItems
            .filter((item) => {
              // "Franchise" (full management) is only for super_admin
              if (item.label === "Franchise" && user.role !== "super_admin") {
                return false;
              }
              // "Franchise Settings" is only for franchise_admin
              if (item.label === "Franchise Settings" && user.role !== "franchise_admin") {
                return false;
              }
              return true;
            })
            .map((item) => {
            if (item.children) {
              const isOpen = openGroups.includes(item.label);
              return (
                <Collapsible key={item.label} open={isOpen} onOpenChange={() => toggleGroup(item.label)}>
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <SheetClose asChild key={child.href || child.label}>
                        <Link
                          to={child.href || "#"}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                            isActive(child.href)
                              ? "bg-white/15 text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <child.icon className="h-4 w-4" />
                          <span>{child.label}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <SheetClose asChild key={item.label}>
                <Link
                  to={item.href || "#"}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3 space-y-1">
        {bottomNavItems.map((item) => (
          <SheetClose asChild key={item.label}>
            <Link
              to={item.href || "#"}
              className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </SheetClose>
        ))}
      </div>

      {/* User & Logout */}
      <div className="border-t border-white/10 p-4 space-y-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-primary text-white text-sm">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-bold text-white">{user.name}</p>
            <p className="truncate text-[10px] uppercase tracking-widest text-white/40">Administrator</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full justify-start gap-3 rounded-none h-11 font-bold uppercase tracking-widest text-xs shadow-lg shadow-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          Log Out System
        </Button>
      </div>
    </div>
  );
}
