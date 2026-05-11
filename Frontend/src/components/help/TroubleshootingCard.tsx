import type { TroubleshootingCategory } from "@/types/help";
import {
  ShieldAlert, BookOpen, CreditCard, MailX, BarChart3, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const iconMap: Record<string, React.ElementType> = {
  ShieldAlert, BookX: BookOpen, CreditCard, MailX, BarChart3, AlertTriangle,
};

interface TroubleshootingCardProps {
  categories: TroubleshootingCategory[];
}

export function TroubleshootingCard({ categories }: TroubleshootingCardProps) {
  if (categories.length === 0) return null;

  return (
    <section id="troubleshooting" className="scroll-mt-24 mb-10">
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                Troubleshooting Guide
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Categorized solutions for common platform issues.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => {
              const Icon = iconMap[category.icon] ?? AlertTriangle;
              return (
                <div
                  key={category.id}
                  className="rounded-xl border border-border/50 bg-muted/10 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-destructive/80" />
                    <h4 className="font-semibold text-sm text-foreground">
                      {category.title}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {category.items.map((item, i) => (
                      <div key={i} className="border-l-2 border-destructive/30 pl-3">
                        <p className="text-sm font-medium text-foreground">{item.issue}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
