import { createClient } from "@supabase/supabase-js";
import { env, hasSupabasePublicConfig, hasSupabaseServerConfig } from "./env";

export function getSupabaseAdmin() {
  if (!hasSupabaseServerConfig()) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
    auth: { persistSession: false },
  });
}

export function getSupabasePublic() {
  if (!hasSupabasePublicConfig()) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: { persistSession: false },
  });
}
