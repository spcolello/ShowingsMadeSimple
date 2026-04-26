import { NextResponse } from "next/server";
import { z } from "zod";
import { sendBuyerVerificationEmail } from "@/lib/buyer-onboarding";
import { getSupabaseAdmin } from "@/lib/supabase";

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

  if (supabase) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: payload.data.email,
      password: payload.data.password,
      phone: payload.data.phone,
      email_confirm: false,
      user_metadata: { full_name: payload.data.fullName, role: "buyer" },
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
      });

      await supabase.from("buyer_profiles").insert({
        user_id: data.user.id,
        full_name: payload.data.fullName,
        phone: payload.data.phone,
        email_verified: false,
        identity_verification_status: "not_started",
        financial_verification_status: "not_started",
        suspended: false,
        buyer_onboarding_completed: false,
      });
    }
  }

  await sendBuyerVerificationEmail(payload.data.email);

  return NextResponse.redirect(
    new URL(`/buyer/onboarding/email?email=${encodeURIComponent(payload.data.email)}`, request.url),
    { status: 303 },
  );
}
