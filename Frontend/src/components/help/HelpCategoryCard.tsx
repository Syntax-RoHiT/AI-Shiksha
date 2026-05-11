import type { HelpSection } from "@/types/help";
import {
  Rocket, Building2, Globe, Users, BookOpen, CreditCard,
  MessageSquare, Brain, Wrench, BarChart3, HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const iconMap: Record<string, React.ElementType> = {
  Rocket, Building2, Globe, Users, BookOpen, CreditCard,
  MessageSquare, Brain, Wrench, BarChart3, HelpCircle,
};

interface HelpCategoryCardProps {
  section: HelpSection;
  onClick: () => void;
}

export function HelpCategoryCard({ section, onClick }: HelpCategoryCardProps) {
  const Icon = iconMap[section.icon] ?? HelpCircle;

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center shrink-0 transition-colors duration-300">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors duration-200">
              {section.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {section.description}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-2">
              {section.features.length} features · {section.workflow.length} steps
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
