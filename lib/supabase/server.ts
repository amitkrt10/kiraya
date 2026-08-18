import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers. Create a new instance per request — never share one across
 * requests, since it's bound to that request's cookies.
 *
 * `cookies()` is read first so Next.js commits to dynamic rendering for this
 * request before anything else runs — this route can then never accidentally
 * get prerendered at build time against unset env vars.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database, "kiraya">(getSupabaseUrl(), getSupabaseAnonKey(), {
    db: { schema: "kiraya" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component render, where cookies can't be
          // written. Safe to ignore as long as middleware.ts is refreshing
          // the session on every request (see middleware.ts).
        }
      },
    },
  });
}
