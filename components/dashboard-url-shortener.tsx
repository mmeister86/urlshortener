"use client";

import UrlShortener from "@/components/url-shortener";
import type { User } from "@supabase/supabase-js";

interface DashboardUrlShortenerProps {
  user: User | null;
}

export default function DashboardUrlShortener({ user }: DashboardUrlShortenerProps) {
  return <UrlShortener user={user} />;
}
