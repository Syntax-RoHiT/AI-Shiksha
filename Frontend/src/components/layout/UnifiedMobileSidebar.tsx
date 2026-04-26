import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  DollarSign,
  MessageSquare,
  Settings,
  GraduationCap,
  BarChart3,
  Trophy,
  LogOut,
  FileText,
  ShoppingCart,
  Target,
  Star,
  Tag,
  HelpCircle,
} from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useFranchise } from "@/contexts/FranchiseContext";
import { SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const getNavItems = (role: UserRole) => {
  switch (role) {
    case "teacher":
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
        { icon: Users, label: "Students", href: "/dashboard/students" },
        { icon: DollarSign, label: "Revenue", href: "/dashboard/revenue" },
        { icon: Tag, label: "Promotions", href: "/dashboard/promotions" },
        { icon: Star, label: "Reviews", href: "/dashboard/reviews" },
        { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
        { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
      ];
    case "student":
      return [
        { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
        { icon: GraduationCap, label: "My Learning", href: "/dashboard/my-courses" },
        { icon: BookOpen, label: "Catalog", href: "/dashboard/catalog" },
        { icon: FileText, label: "Assignments", href: "/dashboard/assignments" },
        { icon: Trophy, label: "Achievements", href: "/dashboard/certificates" },
        { icon: Target, label: "Goals", href: "/dashboard/learning-path" },
        { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
        { icon: ShoppingCart, label: "Cart", href: "/dashboard/cart" },
      ];
    default:
      return [];
  }
};

export function UnifiedMobileSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { branding } = useFranchise();

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const isActive = (href: string) => href === "/dashboard" ? location.pathname === href : location.pathname.startsWith(href);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "teacher": return "Instructor";
      case "student": return "Learner";
      default: return role;
    }
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[hsl(220,50%,15%)] to-[hsl(220,50%,12%)]">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent overflow-hidden">
          {branding.favicon_url || branding.logo_url ? (
            <img src={getImageUrl((branding.favicon_url || branding.logo_url) as string)} alt={branding.lms_name} className="h-8 w-8 object-cover" />
          ) : (
            <GraduationCap className="h-5 w-5 text-white" />
          )}
        </div>
        <span className="text-lg font-bold text-white truncate max-w-[150px]">{branding.lms_name}</span>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-primary text-white">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-white">{user.name}</p>
            <p className="text-xs text-white/50">{getRoleLabel(user.role)}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-3">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                  isActive(item.href)
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </SheetClose>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3 space-y-1 flex-shrink-0">
        <SheetClose asChild>
          <Link to="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
            <Settings className="h-5 w-5" /><span>Settings</span>
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Link to="/dashboard/help" className="flex items-center gap-3 px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
            <HelpCircle className="h-5 w-5" /><span>Help</span>
          </Link>
        </SheetClose>
        <div className="pt-2">
          <Button
            onClick={() => { logout(); navigate("/login"); }}
            variant="destructive"
            className="w-full justify-start gap-3 rounded-lg h-11 font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Log Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
