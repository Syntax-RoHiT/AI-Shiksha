/**
 * AnalyticsTracker.tsx
 *
 * Injects GA4 with send_page_view: false (disables GA4 Enhanced Measurement
 * auto history tracking), then manually fires page_view ONLY for public pages.
 *
 * Pages EXCLUDED from tracking:
 *   /login, /signup, /forgot-password, /reset-password
 *   /learn/*     — fullscreen lesson player
 *   /dashboard/* — all private admin & student pages
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useFranchise } from "@/contexts/FranchiseContext";

// ── Exclusion list ──────────────────────────────────────────────────────────
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

// ── Extract GA4 Measurement ID from raw script HTML ─────────────────────────
function extractMeasurementId(html: string): string | null {
  const match = html.match(/[?&]id=(G-[A-Z0-9]+)/i);
  return match ? match[1] : null;
}

function sendPageView(path: string) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: document.title,
    page_location: window.location.origin + path,
  });
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
  // Track the last path we sent a page_view for — prevents double-firing
  const lastSentPath = useRef<string | null>(null);

  // ── Inject GA4 script and fire the FIRST page_view ─────────────────────────
  useEffect(() => {
    if (scriptInjected.current) return;
    if (!branding.seo_custom_head_scripts) return;

    const id = extractMeasurementId(branding.seo_custom_head_scripts);

    if (!id) {
      // Non-GA4 script (e.g. GTM, Hotjar) — inject raw and exit
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
      scriptInjected.current = true;
      return;
    }

    // 1. Initialize dataLayer & gtag stub BEFORE loading the script
    //    This queues all gtag() calls until gtag.js finishes loading.
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function (...args: any[]) {
        window.dataLayer!.push(args);
      };
    }
    window.gtag("js", new Date());

    // 2. Configure with send_page_view: false
    //    This disables BOTH the auto initial page_view AND
    //    Enhanced Measurement's history-change tracking.
    window.gtag("config", id, { send_page_view: false });

    // 3. Load gtag.js async — all queued calls above will execute once it loads
    if (!document.querySelector(`script[src*="gtag/js"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(script);
    }

    scriptInjected.current = true;

    // 4. Fire the FIRST page_view for the current page (if it's public)
    //    Uses a timeout so gtag.js has started loading and the stub is ready.
    const currentPath = window.location.pathname + window.location.search;
    if (!isExcluded(window.location.pathname)) {
      setTimeout(() => {
        sendPageView(currentPath);
        lastSentPath.current = currentPath;
      }, 300);
    } else {
      lastSentPath.current = currentPath; // mark as "handled" even if excluded
    }
  }, [branding.seo_custom_head_scripts]);

  // ── Fire page_view on subsequent SPA navigations ───────────────────────────
  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // Skip if this path was already handled (e.g. the initial load above)
    if (lastSentPath.current === currentPath) return;

    if (isExcluded(location.pathname)) {
      lastSentPath.current = currentPath;
      return;
    }

    lastSentPath.current = currentPath;

    const timer = setTimeout(() => {
      sendPageView(currentPath);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}
