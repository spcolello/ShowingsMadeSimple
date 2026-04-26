import { NextResponse } from "next/server";
import { z } from "zod";
import { sendAgentVerificationEmail } from "@/lib/agent-onboarding";
import { env } from "@/lib/env";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

const schema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));

  if (!payload.success) {
    return NextResponse.redirect(new URL("/agent/onboarding?error=Invalid account information", request.url), { status: 303 });
  }

  const supabase = getSupabaseAdmin();
  const auth = getSupabasePublic();
  if (supabase && auth) {
    const { data, error } = await auth.auth.signUp({
      email: payload.data.email,
      password: payload.data.password,
      phone: payload.data.phone,
      options: {
        emailRedirectTo: `${env.appUrl}/api/auth/callback`,
        data: { full_name: payload.data.fullName, role: "agent" },
      },
    });

    if (error) {
      return NextResponse.redirect(new URL(`/agent/onboarding?error=${encodeURIComponent(error.message)}`, request.url), { status: 303 });
    }

    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        role: "agent",
        email: payload.data.email,
        full_name: payload.data.fullName,
        phone_number: payload.data.phone,
        email_verified: false,
      });
      await supabase.from("agent_profiles").insert({
        user_id: data.user.id,
        name: payload.data.fullName,
        phone: payload.data.phone,
        phone_number: payload.data.phone,
        email_verified: false,
        license_verification_status: "pending_review",
        brokerage_verification_status: "pending_review",
        w9_verification_status: "pending_review",
        payout_setup_status: "incomplete",
        payouts_enabled: false,
        agent_onboarding_completed: false,
        approval_status: "pending_review",
        service_areas: [],
      });
    }
  }

  await sendAgentVerificationEmail(payload.data.email);
  return NextResponse.redirect(new URL(`/agent/onboarding/email?email=${encodeURIComponent(payload.data.email)}`, request.url), { status: 303 });
}
