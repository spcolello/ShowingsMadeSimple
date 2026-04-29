import { NextResponse } from "next/server";
import { z } from "zod";
import { sendBuyerVerificationEmail } from "@/lib/buyer-onboarding";
import { normalizeUsPhoneNumber } from "@/lib/phone";
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
    return NextResponse.redirect(
      new URL("/buyer/onboarding?error=Invalid account information", request.url),
      { status: 303 },
    );
  }

  const supabase = getSupabaseAdmin();
  const auth = getSupabasePublic();
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const phoneNumber = normalizeUsPhoneNumber(payload.data.phone);

  if (supabase && auth) {
    const { data, error } = await auth.auth.signUp({
      email: payload.data.email,
      password: payload.data.password,
      phone: phoneNumber,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
        data: { full_name: payload.data.fullName, phone_number: phoneNumber, role: "buyer" },
      },
    });

    if (error) {
      return NextResponse.redirect(
        new URL(`/buyer/onboarding?error=${encodeURIComponent(error.message)}`, request.url),
        { status: 303 },
      );
    }

    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        role: "buyer",
        email: payload.data.email,
        full_name: payload.data.fullName,
        phone_number: phoneNumber,
        email_verified: false,
      });

      await supabase.from("buyer_profiles").insert({
        user_id: data.user.id,
        full_name: payload.data.fullName,
        phone: phoneNumber,
        phone_number: phoneNumber,
        email_verified: false,
        identity_verification_status: "pending_review",
        financial_verification_status: "pending_review",
        suspended: false,
        buyer_onboarding_completed: false,
      });
    }
  }

  await sendBuyerVerificationEmail(payload.data.email, `${origin}/api/auth/callback`);

  return NextResponse.redirect(
    new URL(`/buyer/onboarding/email?email=${encodeURIComponent(payload.data.email)}`, request.url),
    { status: 303 },
  );
}
