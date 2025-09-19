import UrlShortener from "@/components/url-shortener";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Prow.in</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <form action="/api/auth/signout" method="post">
                  <Button type="submit" variant="ghost">
                    Abmelden
                  </Button>
                </form>
              </>
            ) : (
              <Button asChild>
                <Link href="/anmelden">Anmelden</Link>
              </Button>
            )}
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Verkürze deine URLs
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Erstelle kurze, teilbare Links und verfolge ihre Performance mit
            detaillierten Analytics. Kostenlos und ohne Registrierung.
          </p>
        </div>

        <UrlShortener user={user} />

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Einfach & Schnell</h3>
            <p className="text-gray-600">
              Füge einfach deine URL ein und erhalte sofort einen kurzen Link
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Detaillierte Analytics
            </h3>
            <p className="text-gray-600">
              Verfolge Klicks, geografische Daten und Referrer-Statistiken
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4v-2m0-6V7a3 3 0 013-3h6a3 3 0 013 3v2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Sicher & Zuverlässig</h3>
            <p className="text-gray-600">
              Deine Links sind sicher gespeichert und jederzeit verfügbar
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
