import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session-utils";
import { isValidUrl } from "@/lib/utils";
import { z } from "zod";

// Schema für die editierbaren Felder
const updateUrlSchema = z.object({
  original_url: z.string().url("Ungültige URL").optional(),
  title: z
    .string()
    .max(100, "Titel darf maximal 100 Zeichen lang sein")
    .nullable()
    .optional(),
  description: z
    .string()
    .max(500, "Beschreibung darf maximal 500 Zeichen lang sein")
    .nullable()
    .optional(),
  expires_at: z
    .string()
    .datetime("Ungültiges Ablaufdatum")
    .nullable()
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const supabase = createClient();
    const { shortCode } = await params;

    // Parse und validiere Request Body
    const body = await request.json();
    const validatedData = updateUrlSchema.parse(body);

    // Prüfe ob mindestens ein Feld zum Update vorhanden ist
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: "Mindestens ein Feld muss aktualisiert werden" },
        { status: 400 }
      );
    }

    // Hole aktuellen User und Session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const session = await getSession();

    // Finde URL und prüfe Berechtigung
    const { data: url, error: urlError } = await supabase
      .from("urls")
      .select(
        "id, user_id, session_id, short_code, custom_code, original_url, title, description, expires_at"
      )
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
        { error: "Keine Berechtigung zum Bearbeiten dieser URL" },
        { status: 403 }
      );
    }

    // Zusätzliche Validierung für original_url
    if (validatedData.original_url && !isValidUrl(validatedData.original_url)) {
      return NextResponse.json({ error: "Ungültige URL" }, { status: 400 });
    }

    // Bereite Update-Daten vor (entferne undefined Werte)
    type UpdateData = {
      original_url?: string;
      title?: string | null;
      description?: string | null;
      expires_at?: string | null;
      updated_at?: string;
    };

    const updateData: UpdateData = {};
    if (validatedData.original_url !== undefined) {
      updateData.original_url = validatedData.original_url;
    }
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.expires_at !== undefined) {
      updateData.expires_at = validatedData.expires_at;
    }

    // Füge updated_at hinzu
    updateData.updated_at = new Date().toISOString();

    console.log("🔄 Updating URL:", {
      url_id: url.id,
      short_code: shortCode,
      user_id: user?.id || null,
      session_id: session.anonymousId || null,
      is_user_owner: isOwner,
      is_session_owner: isSessionOwner,
      update_fields: Object.keys(updateData),
    });

    // Führe Update aus
    const { data: updatedUrl, error: updateError } = await supabase
      .from("urls")
      .update(updateData)
      .eq("id", url.id)
      .select(
        "id, original_url, short_code, custom_code, title, description, expires_at, updated_at"
      )
      .single();

    if (updateError) {
      console.error("❌ Error updating URL:", updateError);
      throw new Error("Fehler beim Aktualisieren der URL");
    }

    console.log("✅ URL successfully updated:", updatedUrl.id);

    return NextResponse.json({
      success: true,
      message: "URL erfolgreich aktualisiert",
      url: {
        id: updatedUrl.id,
        original_url: updatedUrl.original_url,
        short_code: updatedUrl.custom_code || updatedUrl.short_code,
        title: updatedUrl.title,
        description: updatedUrl.description,
        expires_at: updatedUrl.expires_at,
        updated_at: updatedUrl.updated_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validierungsfehler",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("❌ Update URL error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Aktualisieren",
      },
      { status: 500 }
    );
  }
}
