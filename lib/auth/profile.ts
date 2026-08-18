import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { Database } from "@/types/database";

export type Profile = Database["kiraya"]["Tables"]["profiles"]["Row"];

/**
 * Resolves the auth user's application profile from `kiraya.profiles`.
 * Returns null when there's no session, or when the profile row doesn't
 * exist/isn't visible under RLS (e.g. a non-ACTIVE profile).
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data;
}
