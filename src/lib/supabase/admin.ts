import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Server-only Supabase client for public research data.
 * Uses the service-role key so canonical/reference/market/analytics schemas
 * are not blocked by end-user RLS when rendering public research pages.
 */
export function createSupabaseAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
