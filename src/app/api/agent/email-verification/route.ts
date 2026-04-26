import { NextResponse } from "next/server";
import { sendAgentVerificationEmail } from "@/lib/agent-onboarding";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const code = String(form.get("code") ?? "");
  const resend = form.get("resend") === "true";

  if (resend) {
    await sendAgentVerificationEmail(email);
    return NextResponse.redirect(new URL(`/agent/onboarding/email?email=${encodeURIComponent(email)}&resent=true`, request.url), { status: 303 });
  }

  if (code !== "123456") {
    return NextResponse.redirect(
      new URL(`/agent/onboarding/email?email=${encodeURIComponent(email)}&error=${encodeURIComponent("Verification failed. Enter the latest code or request a new one.")}`, request.url),
      { status: 303 },
    );
  }

  const supabase = getSupabaseAdmin();
  if (supabase && email) {
    const { data } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (data?.id) {
      await supabase.from("agent_profiles").update({ email_verified: true }).eq("user_id", data.id);
    }
  }

  return NextResponse.redirect(new URL(`/agent/onboarding/email?email=${encodeURIComponent(email)}&verified=true`, request.url), { status: 303 });
}
