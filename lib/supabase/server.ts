import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieLike = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

type CookieStoreLike = {
  getAll?:
    | (() => Array<{ name: string; value: string }>)
    | Array<{ name: string; value: string }>;
  set?: (
    name: string,
    value: string,
    options?: Record<string, unknown>
  ) => void | Promise<void>;
};

function normalizeCookieStore(cookieStoreOrPromise: unknown) {
  return {
    async getAll(): Promise<Array<{ name: string; value: string }>> {
      const store = (await Promise.resolve(
        cookieStoreOrPromise
      )) as unknown as CookieStoreLike;
      const maybeGetAll = store.getAll;
      if (typeof maybeGetAll === "function")
        return (maybeGetAll as () => Array<{ name: string; value: string }>)();
      if (Array.isArray(maybeGetAll)) return maybeGetAll;
      return [];
    },
    async set(name: string, value: string, options?: Record<string, unknown>) {
      const store = (await Promise.resolve(
        cookieStoreOrPromise
      )) as unknown as CookieStoreLike;
      const maybeSet = store.set;
      if (typeof maybeSet === "function") return maybeSet(name, value, options);
      // no-op if not available
    },
  };
}

export const createClient = () => {
  const cookieStore = cookies();
  const adapter = normalizeCookieStore(cookieStore);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => {
          return (await adapter.getAll()) || [];
        },
        setAll: async (cookiesToSet: CookieLike[]) => {
          try {
            for (const cookie of cookiesToSet) {
              await adapter.set(cookie.name, cookie.value, cookie.options);
            }
          } catch {
            // ignore when unable to set cookies in this context
          }
        },
      },
    }
  );
};
