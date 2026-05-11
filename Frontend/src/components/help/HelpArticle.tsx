import type { HelpSection } from "@/types/help";
import {
  Rocket, Building2, Globe, Users, BookOpen, CreditCard,
  MessageSquare, Brain, Wrench, BarChart3, HelpCircle,
  CheckCircle2, Lightbulb, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const iconMap: Record<string, React.ElementType> = {
  Rocket, Building2, Globe, Users, BookOpen, CreditCard,
  MessageSquare, Brain, Wrench, BarChart3, HelpCircle,
};

interface HelpArticleProps {
  section: HelpSection;
}

export function HelpArticle({ section }: HelpArticleProps) {
  const Icon = iconMap[section.icon] ?? HelpCircle;

  return (
    <section id={section.id} className="scroll-mt-24 mb-10">
      <Card className="border-border/60 shadow-sm overflow-hidden">
        {/* Section Header */}
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl font-bold text-foreground">{section.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          {/* Features List */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Features
            </h4>
            <div className="flex flex-wrap gap-2">
              {section.features.map((f, i) => (
                <Badge key={i} variant="secondary" className="font-normal text-xs px-2.5 py-1">
                  {f}
                </Badge>
              ))}
            </div>
          </div>

          {/* Workflow Steps */}
          {section.workflow.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Workflow
              </h4>
              <ol className="relative border-l-2 border-primary/20 ml-3 space-y-4">
                {section.workflow.map((step) => (
                  <li key={step.step} className="pl-6 relative">
                    <span className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                      {step.step}
                    </span>
                    <p className="font-medium text-foreground text-sm">{step.title}</p>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Expandable Articles */}
          {section.articles.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Help Articles
              </h4>
              <Accordion type="single" collapsible className="w-full">
                {section.articles.map((article) => (
                  <AccordionItem key={article.id} value={article.id} className="border-b-border/40">
                    <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm font-medium">
                      {article.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                      <p className="mb-3">{article.content}</p>
                      {article.tips && article.tips.length > 0 && (
                        <ul className="space-y-2">
                          {article.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Troubleshooting for this section */}
          {section.troubleshooting.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Common Issues
              </h4>
              <div className="space-y-3">
                {section.troubleshooting.map((t, i) => (
                  <div key={i} className="rounded-lg border border-border/50 bg-muted/20 p-3">
                    <p className="text-sm font-medium text-foreground">{t.issue}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t.solution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
