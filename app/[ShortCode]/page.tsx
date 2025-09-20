import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import ClickTracker from "@/components/click-tracker";

interface Props {
  params: {
    ShortCode: string;
  };
}

export default async function RedirectPage({ params }: Props) {
  const { ShortCode: shortCode } = params;

  console.log("🔍 Redirect Debug - shortCode:", shortCode);

  // Finde URL
  const { data: url, error } = await supabaseAdmin
    .from("urls")
    .select("*")
    .or(`short_code.eq.${shortCode},custom_code.eq.${shortCode}`)
    .eq("is_active", true)
    .single();

  console.log("🔍 Redirect Debug - Database result:", { url, error });

  if (error || !url) {
    console.log("🚨 Redirect Debug - URL not found, returning 404");
    notFound();
  }

  // Prüfe Ablaufzeit
  if (url.expires_at && new Date(url.expires_at) < new Date()) {
    notFound();
  }

  // Click-Tracking über Client Component vor Redirect
  const trackingData = {
    shortCode,
    urlId: url.id,
  };

  console.log("✅ Redirect Debug - Redirecting to:", url.original_url);

  // Render ClickTracker Component für ein paar Millisekunden vor Redirect
  return (
    <div>
      <ClickTracker
        shortCode={trackingData.shortCode}
        urlId={trackingData.urlId}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              window.location.href = "${url.original_url}";
            }, 100);
          `,
        }}
      />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Weiterleitung...</p>
        </div>
      </div>
    </div>
  );
}
