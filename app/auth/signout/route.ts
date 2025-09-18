import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PostHog } from "posthog-node";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore,
  } as any);

  // Serverseitig Session erfassen für identify/reset
  const client = new PostHog(process.env.POSTHOG_API_KEY as string, {
    host: "https://eu.i.posthog.com",
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      client.capture({
        event: "user_signed_out",
        distinctId: user.id,
      });
      // Ein explizites reset gibt es serverseitig nicht, client übernimmt das
    }
  } finally {
    await client.shutdown();
  }

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url));
}
