"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Browser Supabase client. Create a fresh instance where needed (e.g. inside
 * a useEffect/useMemo in a Client Component) rather than sharing one module
 * -level singleton across the whole app, so it never gets constructed during
 * server-side rendering with an unset env var.
 */
export function createClient() {
  return createBrowserClient<Database, "kiraya">(getSupabaseUrl(), getSupabaseAnonKey(), {
    db: { schema: "kiraya" },
  });
}
