"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ExternalLink, Calendar } from "lucide-react";
import { truncateUrl } from "@/lib/utils";

interface Click {
  id: string;
  url_id: string;
  created_at: string;
  user_agent: string | null;
  referer: string | null;
  ip_address: string | null;
}

interface UrlWithClicks {
  id: string;
  user_id: string;
  original_url: string;
  short_code: string;
  custom_code: string | null;
  title: string | null;
  created_at: string;
  clicks: Click[];
}

interface UrlsListProps {
  urls: UrlWithClicks[];
  isLoading: boolean;
}

export default function UrlsList({ urls, isLoading }: UrlsListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">URLs werden geladen...</div>
      </div>
    );
  }

  if (!urls || urls.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-xl font-semibold mb-4">
            Noch keine Links erstellt
          </h3>
          <p className="text-gray-600">
            Verwende das Formular oben, um deinen ersten kurzen Link zu
            erstellen
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {urls.map((url) => (
        <Card key={url.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">
                  {url.title || truncateUrl(url.original_url)}
                </CardTitle>
                <p className="text-sm text-gray-500 truncate">
                  {truncateUrl(url.original_url)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`${process.env.NEXT_PUBLIC_BASE_URL}/${
                      url.custom_code || url.short_code
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="sm">
                  <Link
                    href={`/analytics/${url.custom_code || url.short_code}`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  /{url.custom_code || url.short_code}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(url.created_at).toLocaleDateString("de-DE")}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {url.clicks?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Klicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
