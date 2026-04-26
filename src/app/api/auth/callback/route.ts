import { NextResponse } from "next/server";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = getSupabasePublic();
  const admin = getSupabaseAdmin();

  if (supabase) {
    let user: User | null = null;

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
          { status: 303 },
        );
      }

      user = data.session?.user ?? data.user ?? null;
    }

    if (!user && tokenHash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (error) {
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
          { status: 303 },
        );
      }

      user = data.user;
    }

    if (user && admin) {
      const { data: userRow } = await admin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const role = userRow?.role ?? user.user_metadata?.role;

      await admin.from("users").update({ email_verified: true }).eq("id", user.id);
      if (role === "buyer") {
        await admin.from("buyer_profiles").update({ email_verified: true }).eq("user_id", user.id);
      }
      if (role === "agent") {
        await admin.from("agent_profiles").update({ email_verified: true }).eq("user_id", user.id);
      }

      const path =
        role === "buyer"
          ? "/buyer/onboarding/identity"
          : role === "agent"
            ? "/agent/onboarding/license"
            : "/admin";
      const response = NextResponse.redirect(new URL(path, request.url), { status: 303 });
      response.cookies.set("sms_demo_role", role, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      response.cookies.set("sms_user_id", user.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?verified=true", request.url), { status: 303 });
}
