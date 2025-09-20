import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-utils";

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      anonymousId: session.anonymousId || null,
      isLoggedIn: session.isLoggedIn || false,
      userId: session.userId || null,
    });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}
