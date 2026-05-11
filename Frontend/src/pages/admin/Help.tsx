import { useState, useMemo, useCallback } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { helpSections, faqData, troubleshootingCategories } from "@/data/helpData";
import { HelpHero } from "@/components/help/HelpHero";
import { HelpSidebar } from "@/components/help/HelpSidebar";
import { HelpArticle } from "@/components/help/HelpArticle";
import { HelpCategoryCard } from "@/components/help/HelpCategoryCard";
import { FAQAccordion } from "@/components/help/FAQAccordion";
import { TroubleshootingCard } from "@/components/help/TroubleshootingCard";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState(helpSections[0]?.id ?? "");

  // ── Search filtering ──────────────────────────
  const query = searchQuery.toLowerCase().trim();

  const filteredSections = useMemo(() => {
    if (!query) return helpSections;
    return helpSections.filter((s) => {
      const haystack = [
        s.title,
        s.description,
        ...s.features,
        ...s.articles.flatMap((a) => [a.title, a.content, ...(a.tips ?? [])]),
        ...s.troubleshooting.flatMap((t) => [t.issue, t.solution]),
        ...s.workflow.map((w) => w.title + " " + (w.description ?? "")),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [query]);

  const filteredFaqs = useMemo(() => {
    if (!query) return faqData;
    return faqData.filter(
      (f) =>
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredTroubleshooting = useMemo(() => {
    if (!query) return troubleshootingCategories;
    return troubleshootingCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.issue.toLowerCase().includes(query) ||
            item.solution.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [query]);

  // ── Scroll to section ─────────────────────────
  const scrollToSection = useCallback((id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const hasResults =
    filteredSections.length > 0 ||
    filteredFaqs.length > 0 ||
    filteredTroubleshooting.length > 0;

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero + Search */}
        <HelpHero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Category Cards Grid */}
        {!query && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-10">
            {helpSections.map((section) => (
              <HelpCategoryCard
                key={section.id}
                section={section}
                onClick={() => scrollToSection(section.id)}
              />
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <HelpSidebar
            sections={filteredSections}
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {!hasResults && (
              <div className="text-center py-20">
                <p className="text-lg font-medium text-muted-foreground">
                  No results found for "{searchQuery}"
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Try a different search term or browse the modules from the sidebar.
                </p>
              </div>
            )}

            {/* Module Sections */}
            {filteredSections.map((section) => (
              <HelpArticle key={section.id} section={section} />
            ))}

            {/* FAQ */}
            {filteredFaqs.length > 0 && <FAQAccordion faqs={filteredFaqs} />}

            {/* Troubleshooting */}
            {filteredTroubleshooting.length > 0 && (
              <TroubleshootingCard categories={filteredTroubleshooting} />
            )}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
