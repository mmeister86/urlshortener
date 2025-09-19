"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import DashboardUrlShortener from "@/components/dashboard-url-shortener";
import UrlsList from "@/components/urls-list";
import type { User } from "@supabase/supabase-js";

interface Click {
  id: string;
  url_id: string;
  created_at: string;
  user_agent: string | null;
  referer: string | null;
  ip_address: string | null;
}

interface UrlWithClicks {
  id: string;
  user_id: string;
  original_url: string;
  short_code: string;
  custom_code: string | null;
  title: string | null;
  created_at: string;
  clicks: Click[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [urlsWithClicks, setUrlsWithClicks] = useState<UrlWithClicks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Funktion zum Laden der URLs mit Clicks
  const loadUrlsWithClicks = useCallback(
    async (userId: string) => {
      const { data: urls } = await supabase
        .from("urls")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!urls) return [];

      const urlsWithClicksData = await Promise.all(
        urls.map(async (url) => {
          const { data: clicks } = await supabase
            .from("clicks")
            .select("*")
            .eq("url_id", url.id);

          return {
            ...url,
            clicks: clicks || [],
          };
        })
      );

      return urlsWithClicksData;
    },
    [supabase]
  );

  // Callback für neu erstellte URLs
  const handleUrlCreated = useCallback(
    async (newUrlResult: {
      shortUrl: string;
      shortCode: string;
      originalUrl: string;
    }) => {
      console.log("Neue URL wurde erstellt:", newUrlResult);

      // Aktuelle URLs neu laden um sicherzustellen, dass wir die neueste haben
      if (user) {
        const urlsData = await loadUrlsWithClicks(user.id);
        setUrlsWithClicks(urlsData);
      }
    },
    [user, loadUrlsWithClicks]
  );

  // Initial Load und User Check
  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        window.location.href = "/anmelden";
        return;
      }

      setUser(currentUser);
      const urlsData = await loadUrlsWithClicks(currentUser.id);
      setUrlsWithClicks(urlsData);
      setIsLoading(false);
    };

    checkUserAndLoadData();
  }, [loadUrlsWithClicks, supabase.auth]);

  // Optional: Realtime Subscription für Click-Updates (nur für Clicks, URLs werden via Callback aktualisiert)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("clicks-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clicks",
        },
        async (payload) => {
          console.log("Neuer Click hinzugefügt:", payload);
          // Update der entsprechenden URL mit neuem Click
          setUrlsWithClicks((prev) =>
            prev.map((url) =>
              url.id === payload.new.url_id
                ? { ...url, clicks: [...url.clicks, payload.new as Click] }
                : url
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Lädt...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect läuft schon
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Verwalte deine Links und Analytics
              </p>
            </div>
            <div className="flex items-center">
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
        {/* URL Shortener Integration */}
        <div className="mb-8">
          <DashboardUrlShortener user={user} onSuccess={handleUrlCreated} />
        </div>

        {/* Links Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Deine Links</h2>
          <UrlsList urls={urlsWithClicks} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
