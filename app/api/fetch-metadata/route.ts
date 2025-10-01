import { NextRequest, NextResponse } from "next/server";
import { getClientIP } from "@/lib/server-utils";
import { ratelimit } from "@/lib/rate-limit";
import { z } from "zod";

// Runtime Configuration für Node.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fetchMetadataSchema = z.object({
  url: z.string().url("Ungültige URL"),
});

// Eigene Metadata-Extraction ohne native Dependencies
async function extractMetadata(html: string, url: string) {
  // Dynamischer Import von cheerio zur Build-Zeit
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);

  // OpenGraph Image (primär)
  let previewImageUrl =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[property="og:image:url"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    null;

  // Favicon (fallback)
  let faviconUrl =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="apple-touch-icon"]').attr("href") ||
    null;

  // Relativ zu absolute URLs konvertieren
  if (faviconUrl && !faviconUrl.startsWith("http")) {
    const urlObj = new URL(url);
    faviconUrl = faviconUrl.startsWith("/")
      ? `${urlObj.origin}${faviconUrl}`
      : `${urlObj.origin}/${faviconUrl}`;
  }

  if (previewImageUrl && !previewImageUrl.startsWith("http")) {
    const urlObj = new URL(url);
    previewImageUrl = previewImageUrl.startsWith("/")
      ? `${urlObj.origin}${previewImageUrl}`
      : `${urlObj.origin}/${previewImageUrl}`;
  }

  // Titel
  const pageTitle =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text() ||
    null;

  // Beschreibung
  const pageDescription =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null;

  return {
    pageTitle,
    pageDescription,
    previewImageUrl,
    faviconUrl,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting - strenger als normale API-Calls
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

    const body = await request.json();
    const validatedData = fetchMetadataSchema.parse(body);

    // Fetch HTML von der URL mit Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(validatedData.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; URLShortenerBot/1.0; +https://prow.in)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extrahiere Metadaten
    const metadata = await extractMetadata(html, validatedData.url);

    return NextResponse.json(metadata);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Timeout oder Network-Fehler
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json(
          { error: "Die Website hat zu lange zum Antworten gebraucht" },
          { status: 408 }
        );
      }

      if (
        error.message.includes("fetch failed") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("ECONNREFUSED")
      ) {
        return NextResponse.json(
          { error: "Website konnte nicht erreicht werden" },
          { status: 404 }
        );
      }
    }

    console.error("Fetch metadata error:", error);
    return NextResponse.json(
      { error: "Metadaten konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}
