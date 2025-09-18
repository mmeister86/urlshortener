"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Bei Prow.in anmelden</h2>
          <p className="mt-2 text-gray-600">
            Melde dich an, um deine Links zu verwalten und Analytics zu sehen
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          {(() => {
            const baseFromEnv = process.env.NEXT_PUBLIC_BASE_URL?.trim();
            const runtimeOrigin =
              typeof window !== "undefined"
                ? window.location.origin
                : undefined;
            const base =
              baseFromEnv && baseFromEnv.length > 0
                ? baseFromEnv
                : runtimeOrigin;
            const nextParam = searchParams.get("next");
            const redirectTo = base
              ? `${base}/auth/callback${
                  nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""
                }`
              : undefined;

            return (
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={[]}
                view="magic_link"
                redirectTo={redirectTo}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}
