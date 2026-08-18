/**
 * True once both Supabase env vars are set. Lets proxy.ts (and anything else
 * that must run on *every* request, session or not) degrade to "no session"
 * instead of throwing when the app hasn't been configured with real
 * credentials yet — e.g. a fresh checkout before .env.local is filled in.
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Lazily-read env accessors. These intentionally do NOT validate at module
 * load time — Supabase client factories call them at request time (after
 * cookies()/headers() has already forced dynamic rendering), so a missing
 * .env.local never breaks `next build`, only a real request that needs Supabase.
 */

export function getSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase project's URL (Project Settings -> API).",
    );
  }
  return value;
}

export function getSupabaseAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Copy .env.example to .env.local and fill in your Supabase project's anon key (Project Settings -> API).",
    );
  }
  return value;
}
