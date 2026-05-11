import type { FAQ } from "@/types/help";
import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQAccordionProps {
  faqs: FAQ[];
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="scroll-mt-24 mb-10">
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                Frequently Asked Questions
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Quick answers to the most common questions about the platform.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-b-border/40">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm font-medium text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
