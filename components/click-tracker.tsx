"use client";

import { useEffect } from "react";

interface ClickTrackerProps {
  shortCode: string;
  urlId: string;
}

export default function ClickTracker({ shortCode, urlId }: ClickTrackerProps) {
  useEffect(() => {
    const trackClick = async () => {
      try {
        console.log("🔍 Tracking click for:", shortCode);

        const response = await fetch("/api/track-click", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shortCode,
            urlId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Click tracked:", result);
        } else {
          console.error("❌ Failed to track click:", response.status);
        }
      } catch (error) {
        console.error("❌ Click tracking error:", error);
      }
    };

    // Tracking sofort auslösen
    trackClick();
  }, [shortCode, urlId]);

  // Invisible component - nur für Tracking
  return null;
}
