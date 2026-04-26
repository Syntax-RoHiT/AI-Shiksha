import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Trophy,
  Award,
  DollarSign,
  HelpCircle,
  Settings,
  Plus,
  Star,
  Users,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { SidebarLogo } from "./SidebarLogo";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const getNavItems = (role: UserRole): NavItem[] => {
  switch (role) {
    case "student":
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/my-courses" },
        { icon: MessageSquare, label: "AI Assistant", href: "/dashboard/ai-assistant" },
        { icon: Trophy, label: "Leaderboard", href: "/dashboard/leaderboard" },
        { icon: Award, label: "Certificates", href: "/dashboard/certificates" },
        { icon: DollarSign, label: "Transactions", href: "/dashboard/transactions" },
        { icon: HelpCircle, label: "Support", href: "/dashboard/support" },
        { icon: Settings, label: "Profile Settings", href: "/dashboard/settings" },
      ];
    case "teacher":
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Plus, label: "Add Course", href: "/dashboard/courses/new" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/my-courses" },
        { icon: Users, label: "Students", href: "/dashboard/students" },
        { icon: Star, label: "Reviews", href: "/dashboard/reviews" },
        { icon: MessageSquare, label: "Q/A", href: "/dashboard/qa" },
        { icon: Settings, label: "Profile Settings", href: "/dashboard/settings" },
      ];
    default:
      return [];
  }
};

interface MobileStudentSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileStudentSidebar({ open, onClose }: MobileStudentSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!user) return null;

  const navItems = getNavItems(user.role);

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 md:hidden transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-[60] h-screen w-72 flex flex-col md:hidden",
          "bg-gradient-to-b from-[hsl(220,50%,15%)] to-[hsl(220,50%,12%)]",
          "transition-transform duration-300 ease-in-out shadow-2xl",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4 flex-shrink-0">
          <SidebarLogo collapsed={false} />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User info strip */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
          <Avatar className="h-9 w-9 border-2 border-white/20 flex-shrink-0">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-primary text-white text-sm">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-white/50 capitalize">{user.role === "teacher" ? "Instructor" : user.role}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                isActive(item.href)
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-3 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200 w-full"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
