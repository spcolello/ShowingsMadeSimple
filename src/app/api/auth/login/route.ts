import { NextResponse } from "next/server";
import { z } from "zod";
import { nextAgentOnboardingPath, nextBuyerOnboardingPath } from "@/lib/onboarding-routing";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function redirectWithAuthCookies(request: Request, role: string, userId: string, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url), { status: 303 });
  response.cookies.set("sms_demo_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  response.cookies.set("sms_user_id", userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));

  if (!payload.success) {
    return NextResponse.redirect(new URL("/login?error=Enter a valid email and password.", request.url), {
      status: 303,
    });
  }

  if (payload.data.email.toLowerCase() === "admin@gmail.com" && payload.data.password === "admin") {
    return redirectWithAuthCookies(request, "admin", "mock-admin", "/admin");
  }

  const supabase = getSupabasePublic();
  const admin = getSupabaseAdmin();

  if (!supabase || !admin) {
    return NextResponse.redirect(
      new URL("/login?error=Supabase auth is not configured. Use local mock admin only for development.", request.url),
      { status: 303 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword(payload.data);
  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error?.message ?? "Invalid credentials.")}`, request.url),
      { status: 303 },
    );
  }

  if (!data.user.email_confirmed_at) {
    return NextResponse.redirect(
      new URL(`/login?verify=${encodeURIComponent(payload.data.email)}`, request.url),
      { status: 303 },
    );
  }

  const { data: userRow } = await admin
    .from("users")
    .select("id, role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = userRow?.role ?? data.user.user_metadata?.role;
  if (!role) {
    return NextResponse.redirect(new URL("/login?error=No role is assigned to this account.", request.url), {
      status: 303,
    });
  }

  if (role === "buyer") {
    await admin.from("buyer_profiles").update({ email_verified: true }).eq("user_id", data.user.id);
  }
  if (role === "agent") {
    await admin.from("agent_profiles").update({ email_verified: true }).eq("user_id", data.user.id);
  }

  let path = "/admin";
  if (role === "buyer") {
    const { data: profile } = await admin
      .from("buyer_profiles")
      .select("email_verified, government_id_file_url, selfie_file_url, address, soft_credit_check_consent, prequalification_letter_url, buyer_onboarding_completed")
      .eq("user_id", data.user.id)
      .maybeSingle();
    path = nextBuyerOnboardingPath({ ...profile, email_verified: true });
  }
  if (role === "agent") {
    const { data: profile } = await admin
      .from("agent_profiles")
      .select("email_verified, license_number, license_file_url, brokerage_name, broker_manager_name, broker_manager_email, w9_file_url, payout_provider_account_id, payout_setup_status, payouts_enabled, agent_onboarding_completed")
      .eq("user_id", data.user.id)
      .maybeSingle();
    path = nextAgentOnboardingPath({ ...profile, email_verified: true });
  }

  return redirectWithAuthCookies(request, role, data.user.id, path);
}
