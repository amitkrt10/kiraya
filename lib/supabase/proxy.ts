import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

/**
 * Refreshes the Supabase auth session for the incoming request and returns
 * the response that carries any updated session cookies, plus the resolved
 * user (or null). Call this first in proxy.ts, then layer route-protection
 * redirects on top of its result.
 *
 * Degrades to "no session" (instead of throwing) when Supabase env vars
 * aren't set yet, so an unconfigured deployment still correctly redirects
 * protected routes to /login rather than 500ing on every request.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  if (!hasSupabaseEnv()) {
    return { response, user: null };
  }

  const supabase = createServerClient<Database, "kiraya">(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      db: { schema: "kiraya" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
