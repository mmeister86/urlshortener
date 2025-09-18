import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import AnalyticsDashboard from "@/components/analytics-dashboard";

interface Props {
  params: {
    shortCode: string;
  };
}

export default async function AnalyticsPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Prüfe ob URL existiert und dem User gehört
  const { data: url } = await supabase
    .from("urls")
    .select("id, original_url, short_code, custom_code, title")
    .or(`short_code.eq.${params.shortCode},custom_code.eq.${params.shortCode}`)
    .eq("user_id", user.id)
    .single();

  if (!url) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">{url.title || url.original_url}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnalyticsDashboard shortCode={params.shortCode} />
      </main>
    </div>
  );
}
