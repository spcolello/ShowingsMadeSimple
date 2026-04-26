import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

const schema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    role: z.enum(["buyer", "agent"]),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));

  if (!payload.success) {
    return NextResponse.redirect(new URL("/signup?error=Enter valid account information.", request.url), {
      status: 303,
    });
  }

  const auth = getSupabasePublic();
  const admin = getSupabaseAdmin();
  if (!auth || !admin) {
    return NextResponse.redirect(new URL("/signup?error=Supabase auth is not configured.", request.url), {
      status: 303,
    });
  }

  const { data, error } = await auth.auth.signUp({
    email: payload.data.email,
    password: payload.data.password,
    phone: payload.data.phone,
    options: {
      emailRedirectTo: `${env.appUrl}/api/auth/callback`,
      data: { full_name: payload.data.fullName, role: payload.data.role },
    },
  });

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent(error?.message ?? "Account could not be created.")}`, request.url),
      { status: 303 },
    );
  }

  await admin.from("users").upsert({
    id: data.user.id,
    role: payload.data.role,
    email: payload.data.email,
    full_name: payload.data.fullName,
    phone_number: payload.data.phone,
    email_verified: false,
  });

  if (payload.data.role === "buyer") {
    await admin.from("buyer_profiles").upsert({
      user_id: data.user.id,
      full_name: payload.data.fullName,
      phone: payload.data.phone,
      phone_number: payload.data.phone,
      email_verified: false,
      identity_verification_status: "pending_review",
      financial_verification_status: "pending_review",
      buyer_onboarding_completed: false,
      suspended: false,
    }, { onConflict: "user_id" });
  }

  if (payload.data.role === "agent") {
    await admin.from("agent_profiles").upsert({
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
    }, { onConflict: "user_id" });
  }

  return NextResponse.redirect(new URL("/signup?sent=true", request.url), { status: 303 });
}
