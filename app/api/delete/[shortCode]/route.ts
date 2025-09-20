import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const supabase = createClient();
    const { shortCode } = await params;

    // Hole aktuellen User und Session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const session = await getSession();

    // Finde URL und prüfe Berechtigung
    const { data: url, error: urlError } = await supabase
      .from("urls")
      .select("id, user_id, session_id, short_code, custom_code")
      .or(`short_code.eq.${shortCode},custom_code.eq.${shortCode}`)
      .single();

    if (urlError || !url) {
      return NextResponse.json(
        { error: "URL nicht gefunden" },
        { status: 404 }
      );
    }

    // Prüfe Berechtigung
    const isOwner = user?.id === url.user_id;
    const isSessionOwner = !user && session.anonymousId === url.session_id;

    if (!isOwner && !isSessionOwner) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Löschen dieser URL" },
        { status: 403 }
      );
    }

    console.log("🗑️ Deleting URL:", {
      url_id: url.id,
      short_code: shortCode,
      user_id: user?.id || null,
      session_id: session.anonymousId || null,
      is_user_owner: isOwner,
      is_session_owner: isSessionOwner,
    });

    // Lösche zuerst alle Clicks (Foreign Key Constraint)
    const { error: clicksError } = await supabase
      .from("clicks")
      .delete()
      .eq("url_id", url.id);

    if (clicksError) {
      console.error("❌ Error deleting clicks:", clicksError);
      throw new Error("Fehler beim Löschen der Click-Daten");
    }

    // Dann lösche die URL
    const { error: urlDeleteError } = await supabase
      .from("urls")
      .delete()
      .eq("id", url.id);

    if (urlDeleteError) {
      console.error("❌ Error deleting URL:", urlDeleteError);
      throw new Error("Fehler beim Löschen der URL");
    }

    console.log("✅ URL successfully deleted:", url.id);

    return NextResponse.json({
      success: true,
      message: "URL erfolgreich gelöscht",
      deletedUrl: {
        id: url.id,
        shortCode: url.custom_code || url.short_code,
      },
    });
  } catch (error) {
    console.error("❌ Delete URL error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Löschen",
      },
      { status: 500 }
    );
  }
}
