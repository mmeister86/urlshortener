"use client";

import UrlShortener from "@/components/url-shortener";
import type { User } from "@supabase/supabase-js";

interface DashboardUrlShortenerProps {
  user: User | null;
  onSuccess?: (newUrl: {
    shortUrl: string;
    shortCode: string;
    originalUrl: string;
  }) => void;
}

export default function DashboardUrlShortener({
  user,
  onSuccess,
}: DashboardUrlShortenerProps) {
  return <UrlShortener user={user} onSuccess={onSuccess} />;
}
