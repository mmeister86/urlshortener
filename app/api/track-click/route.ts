import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getLocationFromIP, parseUserAgent } from "@/lib/server-utils";
import { after } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shortCode, urlId } = body;

    if (!shortCode || !urlId) {
      return NextResponse.json(
        { error: "ShortCode und URL-ID sind erforderlich" },
        { status: 400 }
      );
    }

    // Hole Headers für Analytics
    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || "";

    // IP-Adresse extrahieren (mit Debug-Info)
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const xRealIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    const ip =
      cfConnectingIp || xForwardedFor?.split(",")[0] || xRealIp || "127.0.0.1";

    console.log("🔍 IP Debug - Headers:", {
      xForwardedFor,
      xRealIp,
      cfConnectingIp,
      finalIp: ip,
    });

    console.log("🔍 Track Click Debug - Received:", {
      shortCode,
      urlId,
      ip,
      userAgent: userAgent.substring(0, 50),
    });

    // Analytics sammeln (mit after Hook - funktioniert in API Routes!)
    after(async () => {
      try {
        console.log("📊 Starting analytics tracking for:", shortCode);

        const location = await getLocationFromIP(ip);
        const deviceInfo = parseUserAgent(userAgent);

        console.log("📍 Location data:", location);
        console.log("📱 Device info:", deviceInfo);

        const clickData = {
          url_id: urlId,
          ip_address: ip,
          user_agent: userAgent,
          referer: referer || null,
          country: location.country,
          city: location.city,
          device_type: deviceInfo.device_type,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
        };

        console.log("💾 Inserting click data:", clickData);

        const { data, error } = await supabaseAdmin
          .from("clicks")
          .insert(clickData);

        if (error) {
          console.error("❌ Failed to insert click:", error);
        } else {
          console.log("✅ Click tracked successfully:", data);
        }
      } catch (error) {
        console.error("❌ Analytics tracking error:", error);
      }
    });

    // Sofortige Antwort zurück (Tracking läuft asynchron)
    return NextResponse.json({
      success: true,
      message: "Click tracking initiated",
      debug: { shortCode, urlId },
    });
  } catch (error) {
    console.error("Track click API error:", error);
    return NextResponse.json(
      { error: "Server Fehler beim Tracking" },
      { status: 500 }
    );
  }
}
