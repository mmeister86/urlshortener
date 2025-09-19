import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ExternalLink, Calendar } from "lucide-react";
import DashboardUrlShortener from "@/components/dashboard-url-shortener";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Lade User's URLs mit Klick-Statistiken
  const { data: urls, error } = await supabase
    .from("urls")
    .select(
      `
      *,
      clicks(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Debug logging
  console.log("Dashboard Query Debug:", {
    user_id: user.id,
    urls_count: urls?.length || 0,
    urls_data: urls,
    error: error
  });

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
              <form action="/auth/signout" method="post">
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
          <DashboardUrlShortener user={user} />
        </div>

        {/* Links Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Deine Links</h2>
          {!urls || urls.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-xl font-semibold mb-4">
                  Noch keine Links erstellt
                </h3>
                <p className="text-gray-600">
                  Verwende das Formular oben, um deinen ersten kurzen Link zu
                  erstellen
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {urls.map((url) => (
                <Card key={url.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {url.title || url.original_url}
                        </CardTitle>
                        <p className="text-sm text-gray-500 truncate">
                          {url.original_url}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={`${process.env.NEXT_PUBLIC_BASE_URL}/${
                              url.custom_code || url.short_code
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button asChild size="sm">
                          <Link
                            href={`/analytics/${
                              url.custom_code || url.short_code
                            }`}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          /{url.custom_code || url.short_code}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(url.created_at).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {url.clicks?.length || 0}
                        </p>
                        <p className="text-sm text-gray-500">Klicks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
