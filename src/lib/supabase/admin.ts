import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-only Supabase client for public research data.
 * Prefer service-role access for canonical schemas, but gracefully fall back
 * to the authenticated server client when the service key is not configured.
 */
export async function createSupabaseAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Supabase URL is not configured.");
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseServerClient();
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
