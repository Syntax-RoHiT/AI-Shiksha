/**
 * AnalyticsTracker.tsx
 *
 * Fires a GA4 page_view event on every React Router navigation.
 * Must be rendered inside <BrowserRouter> and <FranchiseProvider>.
 *
 * Pages EXCLUDED from tracking (private / auth / fullscreen):
 *   /login, /signup, /forgot-password, /reset-password
 *   /learn/*       — fullscreen lesson player
 *   /dashboard/*   — private admin & student area (not public traffic)
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
  "/dashboard",  // all admin + student dashboard pages
];

const isExcluded = (pathname: string) =>
  EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

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
  // GA4's own script auto-fires a page_view on the very first load.
  // We skip our first render to avoid counting the initial page twice.
  const isFirstRender = useRef(true);

  // ── Inject the custom head script once when branding loads ────────────────
  useEffect(() => {
    if (scriptInjected.current) return;
    if (!branding.seo_custom_head_scripts) return;

    let container = document.getElementById("custom-head-scripts");
    if (!container) {
      container = document.createElement("div");
      container.id = "custom-head-scripts";
      document.head.appendChild(container);
    }

    // createContextualFragment correctly executes <script> tags
    const range = document.createRange();
    range.selectNode(container);
    const fragment = range.createContextualFragment(branding.seo_custom_head_scripts);
    container.innerHTML = "";
    container.appendChild(fragment);
    scriptInjected.current = true;
  }, [branding.seo_custom_head_scripts]);

  // ── Fire page_view only on subsequent SPA navigations ────────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // skip — GA4 script already sent the first page_view
    }

    if (isExcluded(location.pathname)) return;

    // Small delay so the page <title> has updated before we send
    const timer = setTimeout(() => {
      if (typeof window.gtag === "function") {
        window.gtag("event", "page_view", {
          page_path: location.pathname + location.search,
          page_title: document.title,
          page_location: window.location.href,
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}
