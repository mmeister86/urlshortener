import { redirect, notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { headers } from "next/headers";
import { getLocationFromIP, parseUserAgent } from "@/lib/server-utils";
import { after } from "next/server";

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

  // Analytics sammeln (nach dem Redirect)
  after(async () => {
    try {
      const headersList = await headers();
      const userAgent = headersList.get("user-agent") || "";
      const referer = headersList.get("referer") || "";

      // IP-Adresse extrahieren (vereinfacht für lokale Entwicklung)
      const ip =
        headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

      const location = await getLocationFromIP(ip);
      const deviceInfo = parseUserAgent(userAgent);

      await supabaseAdmin.from("clicks").insert({
        url_id: url.id,
        ip_address: ip,
        user_agent: userAgent,
        referer: referer || null,
        country: location.country,
        city: location.city,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  });

  // Redirect zur Original URL
  console.log("✅ Redirect Debug - Redirecting to:", url.original_url);
  redirect(url.original_url);
}
