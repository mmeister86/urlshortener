import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession, promoteSessionToUser } from "@/lib/session-utils";

/**
 * Claim anonymous session links for authenticated user
 * Migrates all session_id links to user_id
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Get session ID from client request body (if provided)
    const body = await request.json().catch(() => ({}));
    const clientSessionId = body.sessionId;

    // Get current server session as fallback
    const serverSession = await getSession();

    // Use client session ID if provided, otherwise fallback to server session
    const sessionId = clientSessionId || serverSession.anonymousId;

    if (!sessionId) {
      return NextResponse.json(
        { message: "Keine Session-Links zum Migrieren", claimed: 0 },
        { status: 200 }
      );
    }

    console.log("🔄 Claiming session links:", {
      userId: user.id,
      clientSessionId,
      serverSessionId: serverSession.anonymousId,
      finalSessionId: sessionId,
    });

    // Debug: Check what URLs exist with this session_id
    const { data: existingUrls, error: checkError } = await supabase
      .from("urls")
      .select("id, short_code, session_id, user_id")
      .eq("session_id", sessionId);

    console.log("🔍 Debug - URLs with session_id:", {
      sessionId: sessionId,
      found: existingUrls?.length || 0,
      urls: existingUrls,
    });

    // Debug: Check ALL URLs with any session_id
    const { data: allSessionUrls } = await supabase
      .from("urls")
      .select("id, short_code, session_id, user_id")
      .not("session_id", "is", null);

    console.log("🔍 Debug - ALL session URLs:", {
      total: allSessionUrls?.length || 0,
      sessionIds: allSessionUrls?.map((url) => url.session_id),
    });

    // Start transaction: Update all session links to user links
    const { data: claimedUrls, error: claimError } = await supabase
      .from("urls")
      .update({
        user_id: user.id,
        session_id: null, // Clear session_id after claiming
      })
      .eq("session_id", sessionId)
      .select("id, short_code, custom_code, original_url");

    if (claimError) {
      console.error("❌ Failed to claim session links:", claimError);
      throw claimError;
    }

    const claimedCount = claimedUrls?.length || 0;

    console.log("✅ Successfully claimed links:", {
      count: claimedCount,
      links: claimedUrls?.map((url) => url.custom_code || url.short_code),
    });

    // Promote session to user session (using the actual sessionId)
    if (sessionId === serverSession.anonymousId) {
      await promoteSessionToUser(user.id);
    }

    return NextResponse.json({
      message: `${claimedCount} Links erfolgreich übernommen`,
      claimed: claimedCount,
      links:
        claimedUrls?.map((url) => ({
          shortCode: url.custom_code || url.short_code,
          originalUrl: url.original_url,
        })) || [],
    });
  } catch (error) {
    console.error("❌ Claim session links error:", error);
    return NextResponse.json(
      { error: "Server Fehler beim Übernehmen der Links" },
      { status: 500 }
    );
  }
}
