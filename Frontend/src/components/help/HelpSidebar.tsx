import { cn } from "@/lib/utils";
import type { HelpSection } from "@/types/help";
import {
  Rocket, Building2, Globe, Users, BookOpen, CreditCard,
  MessageSquare, Brain, Wrench, BarChart3, HelpCircle, AlertTriangle,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Rocket, Building2, Globe, Users, BookOpen, CreditCard,
  MessageSquare, Brain, Wrench, BarChart3, HelpCircle, AlertTriangle,
};

interface HelpSidebarProps {
  sections: HelpSection[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export function HelpSidebar({ sections, activeSection, onSectionClick }: HelpSidebarProps) {
  return (
    <nav className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24 space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-3">
          Modules
        </p>
        {sections.map((section) => {
          const Icon = iconMap[section.icon] ?? HelpCircle;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{section.title}</span>
            </button>
          );
        })}

        {/* Extra links for FAQ & Troubleshooting */}
        <div className="border-t border-border/60 mt-3 pt-3 space-y-0.5">
          <button
            onClick={() => onSectionClick("faq")}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left",
              activeSection === "faq"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span>FAQ</span>
          </button>
          <button
            onClick={() => onSectionClick("troubleshooting")}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left",
              activeSection === "troubleshooting"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Troubleshooting</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
