"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

export default function AnalyticsClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialisiere PostHog im Client
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://eu.posthog.com",
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      });
    }
  }, []);

  useEffect(() => {
    if (!pathname) return;
    posthog.capture("$pageview");
  }, [pathname, searchParams]);

  return null;
}
