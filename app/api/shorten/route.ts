import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generateShortCode, isValidUrl, getClientIP } from "@/lib/utils";
import { ratelimit } from "@/lib/rate-limit";
import { z } from "zod";
import { PostHog } from "posthog-node";

const shortenSchema = z.object({
  url: z.string().url("Ungültige URL"),
  customCode: z.string().min(3).max(20).optional(),
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ph = new PostHog(process.env.POSTHOG_API_KEY as string, {
      host: "https://eu.i.posthog.com",
    });
    // Rate Limiting
    const ip = getClientIP(request);
    const { success, reset } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        {
          error: "Rate limit erreicht. Versuche es in einer Minute erneut.",
          reset: new Date(reset * 1000).toISOString(),
        },
        { status: 429 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const validatedData = shortenSchema.parse(body);

    if (!isValidUrl(validatedData.url)) {
      return NextResponse.json({ error: "Ungültige URL" }, { status: 400 });
    }

    // Hole aktuellen User (falls eingeloggt)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let shortCode = validatedData.customCode;

    // Prüfe ob Custom Code bereits existiert
    if (shortCode) {
      const { data: existing } = await supabase
        .from("urls")
        .select("id")
        .eq("custom_code", shortCode)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Custom Code bereits vergeben" },
          { status: 400 }
        );
      }
    } else {
      // Generiere eindeutigen Short Code
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        attempts++;

        const { data: existing } = await supabase
          .from("urls")
          .select("id")
          .eq("short_code", shortCode)
          .single();

        if (!existing) break;

        if (attempts > 10) {
          throw new Error("Konnte keinen eindeutigen Code generieren");
        }
      } while (attempts <= 10);
    }

    const { data: url, error } = await supabase
      .from("urls")
      .insert({
        original_url: validatedData.url,
        short_code: shortCode!,
        custom_code: validatedData.customCode || null,
        title: validatedData.title || null,
        description: validatedData.description || null,
        expires_at: validatedData.expiresAt || null,
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const shortUrl = `${baseUrl}/${url.custom_code || url.short_code}`;

    // Serverseitiges Event (bei eingeloggtem Nutzer mit distinctId)
    if (user?.id) {
      ph.capture({
        event: "url_shortened_server",
        distinctId: user.id,
        properties: {
          short_code: url.custom_code || url.short_code,
        },
      });
      await ph.shutdown();
    }

    return NextResponse.json({
      shortUrl,
      shortCode: url.custom_code || url.short_code,
      originalUrl: url.original_url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Shorten URL error:", error);
    return NextResponse.json({ error: "Server Fehler" }, { status: 500 });
  }
}
