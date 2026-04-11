import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useFranchise } from "@/contexts/FranchiseContext";
import { footerSettingsService, FooterSetting } from "@/lib/api/footerSettingsService";
import { pagesService, Page } from "@/lib/api/pagesService";

export default function Footer() {
  const { branding } = useFranchise();
  const [settings, setSettings] = useState<FooterSetting | null>(null);
  const [publishedPages, setPublishedPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const [footerData, pagesData] = await Promise.all([
          footerSettingsService.getSettings(),
          pagesService.getPages(),
        ]);
        setSettings(footerData);
        setPublishedPages(pagesData.filter((p) => p.is_published));
      } catch (error) {
        console.error("Failed to load footer data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  const siteTitle = settings?.site_title || branding.name || "LearnAI";
  const copyrightText = settings?.copyright_text || `© ${new Date().getFullYear()} ${siteTitle} Inc. All rights reserved.`;
  const customMenus = settings?.menus || [];
  const socialLinks = settings?.social_links || [];
  const showSupport = settings?.show_support_section ?? true; // Default true if null

  if (isLoading) {
    return (
      <footer className="w-full rounded-t-[3rem] bg-white pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-center">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-b from-transparent via-primary/5 to-primary/10 flex flex-col items-center gap-8 w-full px-8 text-center pt-32 pb-32 relative border-t border-gray-100">
      <div className="headline-serif text-2xl md:text-3xl font-light text-text-main flex flex-col items-center gap-4">
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt={siteTitle} className="h-10 object-contain drop-shadow-sm" />
        ) : branding.logo_url ? (
          <img src={branding.logo_url} alt={siteTitle} className="h-10 object-contain drop-shadow-sm" />
        ) : (
          <GraduationCap className="h-10 w-10 text-primary drop-shadow-sm" />
        )}
        {siteTitle}
      </div>
      <nav className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-2xl relative z-10">
        {customMenus.map((link, idx) => (
          <Link
            key={idx}
            to={link.url}
            className="text-sm font-light text-text-muted hover:text-primary hover:underline decoration-primary/30 underline-offset-4 transition-all duration-200"
          >
            {link.label}
          </Link>
        ))}
        
        {showSupport && publishedPages.map((page) => (
          <Link
            key={page.slug}
            to={`/p/${page.slug}`}
            className="text-sm font-light text-text-muted hover:text-primary hover:underline decoration-primary/30 underline-offset-4 transition-all duration-200"
          >
            {page.title}
          </Link>
        ))}
        
        {showSupport && publishedPages.length === 0 && (
          <Link to="/contact" className="text-sm font-light text-text-muted hover:text-primary hover:underline decoration-primary/30 underline-offset-4 transition-all duration-200">
            Contact Us
          </Link>
        )}
      </nav>

      {socialLinks.length > 0 && (
        <div className="flex gap-4 mt-4 relative z-10">
          {socialLinks.map((social, idx) => (
            <a
              key={idx}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[10px] uppercase font-bold text-text-muted shadow-sm hover:text-primary hover:-translate-y-1 hover:shadow-md transition-all"
              title={social.platform}
            >
              {social.platform.substring(0, 1)}
            </a>
          ))}
        </div>
      )}

      <p className="text-sm font-light text-text-muted mt-8 opacity-80">
        {copyrightText}
      </p>
    </footer>
  );
}
