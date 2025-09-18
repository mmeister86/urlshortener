import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");

  if (!code) {
    logger.warn("Auth Callback ohne 'code' Param", { url: request.url });
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logger.error("exchangeCodeForSession fehlgeschlagen", error);
    return NextResponse.redirect(
      new URL("/auth?error=auth_failed", request.url)
    );
  }

  // Ziel bestimmen: optional 'next' respektieren, nur gleiche Origin zulassen
  let redirectUrl: URL | undefined;
  if (nextParam) {
    try {
      const candidate = new URL(nextParam, requestUrl.origin);
      if (candidate.origin === requestUrl.origin) {
        redirectUrl = candidate;
      }
    } catch {
      // ignorieren bei ungültiger URL
    }
  }

  if (!redirectUrl) {
    redirectUrl = new URL("/dashboard", requestUrl.origin);
  }

  // Reste der Supabase-Query-Parameter entfernen
  redirectUrl.searchParams.delete("code");
  redirectUrl.searchParams.delete("type");
  redirectUrl.searchParams.delete("next");

  return NextResponse.redirect(redirectUrl);
}
