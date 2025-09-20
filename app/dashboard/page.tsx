"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import DashboardUrlShortener from "@/components/dashboard-url-shortener";
import UrlsList from "@/components/urls-list";
import ClaimLinksButton from "@/components/claim-links-button";
import { getClientSession } from "@/lib/session-client";
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
  user_id: string | null; // Can be null for anonymous links
  session_id: string | null; // New field
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
  const [hasSessionLinks, setHasSessionLinks] = useState(false);
  const supabase = createClient();

  // Funktion zum Laden der URLs mit Clicks (für eingeloggte User)
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

  // Funktion zum Laden der Session-URLs (für anonyme User)
  const loadSessionUrls = useCallback(
    async (sessionId: string) => {
      console.log("🔍 Loading session URLs for:", sessionId);

      const { data: urls } = await supabase
        .from("urls")
        .select("*")
        .eq("session_id", sessionId)
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

      console.log("📊 Found session URLs:", urlsWithClicksData.length);
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
      } else {
        // For anonymous users, reload session URLs
        const session = await getClientSession();
        if (session?.anonymousId) {
          const urlsData = await loadSessionUrls(session.anonymousId);
          setUrlsWithClicks(urlsData);
        }
      }
    },
    [user, loadUrlsWithClicks, loadSessionUrls]
  );

  // Callback when links are claimed
  const handleLinksClaimed = useCallback(
    async (count: number) => {
      if (count > 0 && user) {
        // Reload user's links to include newly claimed ones
        const urlsData = await loadUrlsWithClicks(user.id);
        setUrlsWithClicks(urlsData);
        setHasSessionLinks(false); // No more session links to claim
      }
    },
    [user, loadUrlsWithClicks]
  );

  // Callback when a URL is deleted
  const handleUrlDeleted = useCallback((deletedUrlId: string) => {
    setUrlsWithClicks((prev) => prev.filter((url) => url.id !== deletedUrlId));
  }, []);

  // Initial Load und User Check
  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        // Try to load anonymous session URLs
        const session = await getClientSession();
        if (session?.anonymousId) {
          const urlsData = await loadSessionUrls(session.anonymousId);
          setUrlsWithClicks(urlsData);
        }
        setIsLoading(false);
        return;
      }

      setUser(currentUser);
      const urlsData = await loadUrlsWithClicks(currentUser.id);
      setUrlsWithClicks(urlsData);
      setIsLoading(false);
    };

    checkUserAndLoadData();
  }, [loadUrlsWithClicks, loadSessionUrls, supabase.auth]);

  // Check for session links when user logs in (only once)
  useEffect(() => {
    if (user?.id) {
      // Check for claimable session links
      const checkForSessionLinks = async () => {
        try {
          const session = await getClientSession();
          if (session?.anonymousId) {
            const { data: sessionUrls } = await supabase
              .from("urls")
              .select("id")
              .eq("session_id", session.anonymousId);

            setHasSessionLinks((sessionUrls?.length || 0) > 0);
          }
        } catch (error) {
          console.error("Failed to check session links:", error);
        }
      };

      checkForSessionLinks();
    }
  }, [user?.id, supabase]); // Only depend on user.id, not the full user object

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                {user
                  ? "Verwalte deine Links und Analytics"
                  : "Erstelle und verwalte gekürzte Links (Anmeldung optional)"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <form action="/api/auth/signout" method="post">
                  <Button type="submit" variant="ghost">
                    Abmelden
                  </Button>
                </form>
              ) : (
                <>
                  <Button
                    onClick={() => (window.location.href = "/anmelden")}
                    variant="outline"
                  >
                    Anmelden
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/registrieren")}
                    variant="default"
                  >
                    Registrieren
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-8rem)]">
        {/* Two Column Layout */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 min-h-full">
          {/* Left Column - URL Shortener (Sticky) */}
          <div className="lg:sticky lg:top-32 lg:h-fit mb-8 lg:mb-0">
            <div className="flex flex-col gap-6">
              {/* URL Shortener Integration */}
              <div>
                <DashboardUrlShortener
                  user={user}
                  onSuccess={handleUrlCreated}
                />
              </div>

              {/* Claim Links Section - Only show for logged-in users with session links */}
              {user && hasSessionLinks && (
                <div>
                  <ClaimLinksButton onLinksClaimed={handleLinksClaimed} />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Links List */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {user ? "Deine Links" : "Deine Session-Links"}
            </h2>
            {!user && urlsWithClicks.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Tipp:</strong> Melde dich an oder registriere dich,
                  um deine Links dauerhaft zu speichern und erweiterte Analytics
                  zu erhalten!
                </p>
              </div>
            )}
            {/* URLs List */}
            <div>
              <UrlsList
                urls={urlsWithClicks}
                isLoading={isLoading}
                onUrlDeleted={handleUrlDeleted}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
