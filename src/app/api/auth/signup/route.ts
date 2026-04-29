import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeUsPhoneNumber } from "@/lib/phone";
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

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const phoneNumber = normalizeUsPhoneNumber(payload.data.phone);

  const { data, error } = await auth.auth.signUp({
    email: payload.data.email,
    password: payload.data.password,
    phone: phoneNumber,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: { full_name: payload.data.fullName, phone_number: phoneNumber, role: payload.data.role },
    },
  });

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent(error?.message ?? "Account could not be created.")}`, request.url),
      { status: 303 },
    );
  }

  if (!data.user.phone) {
    await admin.auth.admin.updateUserById(data.user.id, {
      phone: phoneNumber,
      user_metadata: {
        ...data.user.user_metadata,
        full_name: payload.data.fullName,
        phone_number: phoneNumber,
        role: payload.data.role,
      },
    });
  }

  const { error: userError } = await admin.from("users").upsert({
    id: data.user.id,
    role: payload.data.role,
    email: payload.data.email,
    full_name: payload.data.fullName,
    phone_number: phoneNumber,
    email_verified: false,
  });

  if (userError) {
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent(userError.message)}`, request.url),
      { status: 303 },
    );
  }

  if (payload.data.role === "buyer") {
    const { error: buyerError } = await admin.from("buyer_profiles").upsert({
      user_id: data.user.id,
      full_name: payload.data.fullName,
      phone: phoneNumber,
      phone_number: phoneNumber,
      email_verified: false,
      identity_verification_status: "pending_review",
      financial_verification_status: "pending_review",
      buyer_onboarding_completed: false,
      suspended: false,
    }, { onConflict: "user_id" });

    if (buyerError) {
      return NextResponse.redirect(
        new URL(`/signup?error=${encodeURIComponent(buyerError.message)}`, request.url),
        { status: 303 },
      );
    }
  }

  if (payload.data.role === "agent") {
    const { error: agentError } = await admin.from("agent_profiles").upsert({
      user_id: data.user.id,
      name: payload.data.fullName,
      phone: phoneNumber,
      phone_number: phoneNumber,
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

    if (agentError) {
      return NextResponse.redirect(
        new URL(`/signup?error=${encodeURIComponent(agentError.message)}`, request.url),
        { status: 303 },
      );
    }
  }

  return NextResponse.redirect(new URL("/signup?sent=true", request.url), { status: 303 });
}
