import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, Menu, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useFranchise } from "@/contexts/FranchiseContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UnifiedMobileSidebar } from "./UnifiedMobileSidebar";
import { getImageUrl } from "@/lib/utils";

interface UnifiedTopBarProps {
  title?: string;
  subtitle?: string;
}

export function UnifiedTopBar({ title, subtitle }: UnifiedTopBarProps) {
  const { user } = useAuth();
  const { branding } = useFranchise();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px] z-[60]">
          <UnifiedMobileSidebar />
        </SheetContent>
      </Sheet>

      {/* Title Section */}
      <div className="hidden md:block">
        {title && (
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Mobile Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent overflow-hidden">
          {branding.favicon_url || branding.logo_url ? (
            <img src={getImageUrl((branding.favicon_url || branding.logo_url) as string)} alt={branding.lms_name} className="h-8 w-8 object-cover" />
          ) : (
            <GraduationCap className="h-5 w-5 text-white" />
          )}
        </div>
        <span className="text-lg font-bold truncate max-w-[120px]">{branding.lms_name}</span>
      </Link>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-10 h-9 bg-muted/50 border-0 focus:bg-background focus:border"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-medium">
            3
          </span>
        </Button>

        <div className="md:hidden">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.slice(0, 2).toUpperCase() || "US"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
