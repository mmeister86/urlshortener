"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Globe,
  Monitor,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  url: {
    originalUrl: string;
    shortCode: string;
    title: string | null;
    createdAt: string;
  };
  analytics: {
    totalClicks: number;
    uniqueClicks: number;
    clicksByDay: Record<string, number>;
    topReferrers: Array<{ referrer: string; count: number }>;
    topCountries: Array<{ country: string; count: number }>;
    topDevices: Array<{ device: string; count: number }>;
    recentClicks: Array<{
      createdAt: string;
      country: string | null;
      referer: string | null;
      browser: string | null;
      device_type: string | null;
    }>;
  };
}

interface Props {
  shortCode: string;
}

export default function AnalyticsDashboard({ shortCode }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics/${shortCode}`);

        if (!response.ok) {
          throw new Error("Fehler beim Laden der Analytics");
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Ein Fehler ist aufgetreten"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [shortCode]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-red-500 mb-4">Fehler: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Keine Daten gefunden</p>
        </CardContent>
      </Card>
    );
  }

  const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${data.url.shortCode}`;

  // Erstelle Chart-Daten für die letzten 30 Tage
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split("T")[0];
  });

  const chartData = last30Days.map((date) => ({
    date,
    clicks: data.analytics.clicksByDay[date] || 0,
  }));

  return (
    <div className="space-y-6">
      {/* URL Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">
                {data.url.title || "Ohne Titel"}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {data.url.originalUrl}
              </p>
              <p className="text-sm text-blue-600 font-mono">{shortUrl}</p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                onClick={() => navigator.clipboard.writeText(shortUrl)}
                size="sm"
                variant="outline"
              >
                Kopieren
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Klicks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.analytics.totalClicks}
            </div>
            <p className="text-xs text-muted-foreground">
              Seit {new Date(data.url.createdAt).toLocaleDateString("de-DE")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Klicks</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.analytics.uniqueClicks}
            </div>
            <p className="text-xs text-muted-foreground">
              Verschiedene IP-Adressen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Land</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.analytics.topCountries[0]?.country || "Keine Daten"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.analytics.topCountries[0]?.count || 0} Klicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Device</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.analytics.topDevices[0]?.device || "Keine Daten"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.analytics.topDevices[0]?.count || 0} Klicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Referrer</CardTitle>
          </CardHeader>
          <CardContent>
            {data.analytics.topReferrers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Keine Referrer-Daten
              </p>
            ) : (
              <div className="space-y-2">
                {data.analytics.topReferrers
                  .slice(0, 5)
                  .map((referrer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm truncate flex-1">
                        {referrer.referrer}
                      </span>
                      <span className="text-sm font-semibold text-blue-600">
                        {referrer.count}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Länder</CardTitle>
          </CardHeader>
          <CardContent>
            {data.analytics.topCountries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Keine Länder-Daten
              </p>
            ) : (
              <div className="space-y-2">
                {data.analytics.topCountries
                  .slice(0, 5)
                  .map((country, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{country.country}</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {country.count}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Clicks */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Klicks</CardTitle>
        </CardHeader>
        <CardContent>
          {data.analytics.recentClicks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Noch keine Klicks</p>
          ) : (
            <div className="space-y-2">
              {data.analytics.recentClicks.slice(0, 10).map((click, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm border-b pb-2"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-500">
                      {new Date(click.createdAt).toLocaleString("de-DE")}
                    </span>
                    <span>{click.country || "Unknown"}</span>
                    <span className="text-gray-400">
                      {click.device_type || "Unknown"}
                    </span>
                  </div>
                  <span className="text-gray-400 truncate max-w-48">
                    {click.referer ? new URL(click.referer).hostname : "Direct"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
