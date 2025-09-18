import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const createClient = async () => {
  // Next.js 15+: cookies() ist asynchron und muss awaited werden
  const cookieStore = await cookies();
  // Supabase-Helper erwartet synchronen Zugriff im Callback
  return createServerComponentClient({ cookies: () => cookieStore } as any);
};
