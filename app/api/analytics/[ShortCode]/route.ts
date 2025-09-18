/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const supabase = createClient();
    const { shortCode } = params;

    // Hole aktuellen User
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Finde URL
    const { data: url, error: urlError } = await supabase
      .from("urls")
      .select(
        `
        *,
        clicks (*)
      `
      )
      .or(`short_code.eq.${shortCode},custom_code.eq.${shortCode}`)
      .eq("user_id", user.id)
      .single();

    if (urlError || !url) {
      return NextResponse.json(
        { error: "URL nicht gefunden" },
        { status: 404 }
      );
    }

    // Berechne Analytics
    const totalClicks = url.clicks.length;
    const uniqueIPs = new Set(url.clicks.map((click: any) => click.ip_address));
    const uniqueClicks = uniqueIPs.size;

    // Clicks nach Tag gruppieren (letzte 30 Tage)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentClicks = url.clicks.filter(
      (click: any) => new Date(click.created_at) >= thirtyDaysAgo
    );

    const clicksByDay = recentClicks.reduce(
      (acc: Record<string, number>, click: any) => {
        const day = click.created_at.split("T")[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      },
      {}
    );

    // Top Referrer
    const referrerCounts = recentClicks.reduce(
      (acc: Record<string, number>, click: any) => {
        const referrer = click.referer || "Direct";
        // Extrahiere Domain aus Referrer
        try {
          const url = new URL(referrer);
          const domain = url.hostname;
          acc[domain] = (acc[domain] || 0) + 1;
        } catch {
          acc["Direct"] = (acc["Direct"] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    const topReferrers = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }));

    // Top Länder
    const countryCounts = recentClicks.reduce(
      (acc: Record<string, number>, click: any) => {
        const country = click.country || "Unknown";
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      },
      {}
    );

    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // Device Types
    const deviceCounts = recentClicks.reduce(
      (acc: Record<string, number>, click: any) => {
        const device = click.device_type || "Unknown";
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      },
      {}
    );

    const topDevices = Object.entries(deviceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([device, count]) => ({ device, count }));

    return NextResponse.json({
      url: {
        originalUrl: url.original_url,
        shortCode: url.custom_code || url.short_code,
        title: url.title,
        createdAt: url.created_at,
      },
      analytics: {
        totalClicks,
        uniqueClicks,
        clicksByDay,
        topReferrers,
        topCountries,
        topDevices,
        recentClicks: recentClicks.slice(0, 50).map((click: any) => ({
          createdAt: click.created_at,
          country: click.country,
          referer: click.referer,
          browser: click.browser,
          device_type: click.device_type,
        })),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Server Fehler" }, { status: 500 });
  }
}
