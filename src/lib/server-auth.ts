import { cookies } from "next/headers";
import { env } from "./env";
import { getSupabaseAdmin } from "./supabase";

export type AppRole = "buyer" | "agent" | "admin";
type AuthSession = { userId: string; role: AppRole };

export async function getSessionCookieRole() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("sms_user_id")?.value;
  const role = cookieStore.get("sms_demo_role")?.value as AppRole | undefined;
  return { userId, role };
}

export async function requireAppRole(role: AppRole): Promise<AuthSession | null> {
  const session = await getSessionCookieRole();
  if (!session.userId || session.role !== role) {
    return null;
  }

  if (session.userId.startsWith("mock-") && !env.enableDemoAccess) {
    return null;
  }

  return { userId: session.userId, role: session.role };
}

export async function getAuthenticatedProfileId(role: "buyer" | "agent") {
  const session = await requireAppRole(role);
  if (!session) {
    return null;
  }

  if (session.userId.startsWith("mock-")) {
    return `mock-${role}`;
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  const table = role === "buyer" ? "buyer_profiles" : "agent_profiles";
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq("user_id", session.userId)
    .maybeSingle();

  return data?.id ?? null;
}
