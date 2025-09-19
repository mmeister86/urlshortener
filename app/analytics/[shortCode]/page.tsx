"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import type { User } from "@supabase/supabase-js";

interface Props {
  params: Promise<{
    shortCode: string;
  }>;
}

export default function AnalyticsPage({ params }: Props) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/anmelden");
        return;
      }

      setUser(currentUser);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, supabase.auth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Lädt...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect läuft bereits
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600">
                  Detaillierte Statistiken für /{resolvedParams.shortCode}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
              >
                Dashboard
              </Button>
              <form action="/api/auth/signout" method="post">
                <Button type="submit" variant="ghost">
                  Abmelden
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnalyticsDashboard shortCode={resolvedParams.shortCode} />
      </main>
    </div>
  );
}
