/**
 * AnalyticsTracker.tsx
 *
 * Correctly tracks page views for public pages only.
 * Uses script.onload to guarantee gtag.js is ready before firing events.
 * Disables GA4 Enhanced Measurement auto-tracking via send_page_view:false
 * so /dashboard/* is never counted.
 *
 * EXCLUDED from tracking:
 *   /login, /signup, /forgot-password, /reset-password
 *   /learn/*     — fullscreen lesson player
 *   /dashboard/* — all private admin & student pages
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useFranchise } from "@/contexts/FranchiseContext";

const EXCLUDED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/learn/",
  "/dashboard",
];

const isExcluded = (pathname: string) =>
  EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

function extractMeasurementId(html: string): string | null {
  const match = html.match(/[?&]id=(G-[A-Z0-9]+)/i);
  return match ? match[1] : null;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function AnalyticsTracker() {
  const location = useLocation();
  const { branding } = useFranchise();
  const scriptInjected = useRef(false);
  const gtagReady = useRef(false);           // true once gtag.js has fully loaded
  const lastSentPath = useRef<string | null>(null);

  // ── Inject GA4 and fire the first page_view via onload ───────────────────
  useEffect(() => {
    if (scriptInjected.current) return;
    if (!branding.seo_custom_head_scripts) return;
    scriptInjected.current = true;

    const id = extractMeasurementId(branding.seo_custom_head_scripts);

    if (!id) {
      // Non-GA4 tag (GTM, Hotjar, etc.) — inject raw and done
      let container = document.getElementById("custom-head-scripts");
      if (!container) {
        container = document.createElement("div");
        container.id = "custom-head-scripts";
        document.head.appendChild(container);
      }
      const range = document.createRange();
      range.selectNode(container);
      const fragment = range.createContextualFragment(branding.seo_custom_head_scripts);
      container.innerHTML = "";
      container.appendChild(fragment);
      gtagReady.current = true;
      return;
    }

    // 1. Set up dataLayer and gtag stub BEFORE loading the script
    //    All calls below queue up and are processed once gtag.js loads.
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function (...args: any[]) {
        window.dataLayer!.push(args);
      };
    }
    window.gtag("js", new Date());

    // 2. Configure property with send_page_view:false
    //    — This disables GA4 Enhanced Measurement's automatic page_view
    //      on both the initial load AND all future history changes.
    //    — We manually control ALL page_view events below.
    window.gtag("config", id, { send_page_view: false });

    // 3. Load gtag.js — use onload to fire the first page_view ONLY when ready
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;

    script.onload = () => {
      gtagReady.current = true;

      const currentPath = window.location.pathname + window.location.search;
      lastSentPath.current = currentPath;

      // Fire initial page_view if landing on a public page
      if (!isExcluded(window.location.pathname) && typeof window.gtag === "function") {
        window.gtag("event", "page_view", {
          page_path: currentPath,
          page_title: document.title,
          page_location: window.location.href,
        });
      }
    };

    script.onerror = () => {
      // Script blocked (adblocker etc.) — mark as ready anyway so nav tracking works if possible
      gtagReady.current = true;
    };

    document.head.appendChild(script);
  }, [branding.seo_custom_head_scripts]);

  // ── Fire page_view on subsequent SPA navigations ─────────────────────────
  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // Skip if same path as last sent (handles initial render)
    if (lastSentPath.current === currentPath) return;
    lastSentPath.current = currentPath;

    if (isExcluded(location.pathname)) return;

    // If gtag.js hasn't loaded yet, skip — the onload handler will cover it
    if (!gtagReady.current) return;

    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: currentPath,
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, [location.pathname, location.search]);

  return null;
}
