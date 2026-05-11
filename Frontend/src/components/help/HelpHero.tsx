import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HelpHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function HelpHero({ searchQuery, onSearchChange }: HelpHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 mb-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative px-6 py-10 sm:px-10 sm:py-14 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Admin Documentation
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
          Help &amp; Documentation
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8">
          Everything you need to configure, manage, and scale your LMS platform.
          Browse guides by module or search for specific topics.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search documentation…  e.g. 'course management', 'razorpay', 'roles'"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-4 h-12 text-base rounded-xl bg-background/80 backdrop-blur border-border/60 shadow-sm focus-visible:ring-primary/30"
          />
        </div>
      </div>
    </div>
  );
}
