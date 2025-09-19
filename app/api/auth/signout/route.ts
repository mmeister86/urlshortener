import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Signout route called");
    console.log("🔍 Request URL:", request.url);
    console.log("🔍 Request headers:", {
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      "x-forwarded-host": request.headers.get("x-forwarded-host"),
      "x-forwarded-proto": request.headers.get("x-forwarded-proto"),
    });

    const supabase = createClient();

    // Prüfe ob eine Session vorhanden ist
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("📋 Session status:", session ? "Active" : "None");

    // Konstruiere korrekte Redirect-URL vor dem Supabase signOut
    // Verwende x-forwarded-host und x-forwarded-proto für korrekte Prod-URL
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const host = request.headers.get("host");

    let redirectUrl: URL;
    if (forwardedHost && forwardedProto) {
      // Prod-Umgebung mit Proxy
      redirectUrl = new URL("/", `${forwardedProto}://${forwardedHost}`);
    } else if (host) {
      // Fallback auf host header
      const protocol = host.includes("localhost") ? "http" : "https";
      redirectUrl = new URL("/", `${protocol}://${host}`);
    } else {
      // Letzter Fallback auf request.url
      redirectUrl = new URL("/", request.url);
    }

    // Wenn eine Session vorhanden ist, melde den User ab
    if (session) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Logout error:", error);
        // Auch bei Fehlern weiterleiten, da der User sich abmelden möchte
      } else {
        console.log("✅ User logged out successfully");
      }
    }

    console.log("🔄 Redirecting to:", redirectUrl.toString());

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ Unexpected signout error:", error);
    // Selbst bei Fehlern zur Homepage weiterleiten
    // Verwende gleiche Logik wie oben für korrekte URL
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const host = request.headers.get("host");

    let redirectUrl: URL;
    if (forwardedHost && forwardedProto) {
      redirectUrl = new URL("/", `${forwardedProto}://${forwardedHost}`);
    } else if (host) {
      const protocol = host.includes("localhost") ? "http" : "https";
      redirectUrl = new URL("/", `${protocol}://${host}`);
    } else {
      redirectUrl = new URL("/", request.url);
    }

    return NextResponse.redirect(redirectUrl);
  }
}
