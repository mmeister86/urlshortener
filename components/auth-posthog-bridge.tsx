"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

export default function AuthPosthogBridge() {
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email,
        });
        posthog.capture("user_signed_in", { method: "magic_link" });
      }
      if (event === "SIGNED_OUT") {
        posthog.reset();
        posthog.capture("user_signed_out");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
