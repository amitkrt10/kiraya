import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

/**
 * Resolves the current Supabase Auth user for this request. Returns null
 * when there's no session — callers decide what to do (redirect, render a
 * signed-out state, etc.), this never redirects on its own.
 *
 * Degrades to null (instead of throwing) when Supabase env vars aren't set
 * yet, matching lib/supabase/proxy.ts — this runs on ambient, no-user-action
 * page loads (e.g. the root redirect), so it must not crash an unconfigured
 * deployment; a real login attempt still surfaces a clear error.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
