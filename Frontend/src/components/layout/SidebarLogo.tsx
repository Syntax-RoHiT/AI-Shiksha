import { GraduationCap } from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { useFranchise } from "@/contexts/FranchiseContext";
import { Link } from "react-router-dom";

interface SidebarLogoProps {
    collapsed?: boolean;
}

export function SidebarLogo({ collapsed }: SidebarLogoProps) {
    const { branding } = useFranchise();

    return (
        <Link to="/" className={cn("flex items-center gap-2 overflow-hidden transition-all duration-300", collapsed ? "w-8" : "w-full")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent flex-shrink-0 overflow-hidden">
                {branding.favicon_url || branding.logo_url ? (
                    <img src={getImageUrl((branding.favicon_url || branding.logo_url) as string)} alt={branding.lms_name} className="h-8 w-8 object-cover" />
                ) : (
                    <GraduationCap className="h-5 w-5 text-white" />
                )}
            </div>
            <span className={cn("text-lg font-bold text-white whitespace-nowrap transition-opacity duration-200", collapsed ? "opacity-0" : "opacity-100")}>
                {branding.lms_name}
            </span>
        </Link>
    );
}

