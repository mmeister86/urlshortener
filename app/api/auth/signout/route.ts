import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Signout route called");

    const supabase = createClient();

    // Prüfe ob eine Session vorhanden ist
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("📋 Session status:", session ? "Active" : "None");

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

    // Erfolgreiche Abmeldung - Weiterleitung zur Homepage
    const redirectUrl = new URL("/", request.url);
    console.log("🔄 Redirecting to:", redirectUrl.toString());

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ Unexpected signout error:", error);
    // Selbst bei Fehlern zur Homepage weiterleiten
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }
}
