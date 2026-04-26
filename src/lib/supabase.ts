import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseServerConfig } from "./env";

export function getSupabaseAdmin() {
  if (!hasSupabaseServerConfig()) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
    auth: { persistSession: false },
  });
}
