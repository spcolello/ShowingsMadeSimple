import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeUsPhoneNumber } from "@/lib/phone";
import { checkPhoneVerificationCode } from "@/lib/sms";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  role: z.enum(["buyer", "agent"]),
  code: z.string().min(4),
  returnTo: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = (await cookies()).get("sms_user_id")?.value;
  const currentRole = (await cookies()).get("sms_demo_role")?.value;
  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  const fallbackPath = parsed.success ? parsed.data.returnTo ?? `/${parsed.data.role}/onboarding/phone` : "/login";

  if (!parsed.success || !userId || currentRole !== parsed.data.role) {
    return NextResponse.redirect(new URL(`${fallbackPath}?phoneError=Login required.`, request.url), { status: 303 });
  }

  if (userId.startsWith("mock-")) {
    return NextResponse.redirect(new URL(nextPath(parsed.data.role), request.url), { status: 303 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.redirect(new URL(`${fallbackPath}?phoneError=Supabase is not configured.`, request.url), { status: 303 });
  }

  const table = parsed.data.role === "buyer" ? "buyer_profiles" : "agent_profiles";
  const { data: profile } = await supabase
    .from(table)
    .select("phone, phone_number")
    .eq("user_id", userId)
    .maybeSingle();
  const phone = normalizeUsPhoneNumber(profile?.phone_number ?? profile?.phone ?? "");

  if (!phone || !phone.startsWith("+")) {
    return NextResponse.redirect(new URL(`${fallbackPath}?phoneError=Valid phone number missing.`, request.url), { status: 303 });
  }

  const result = await checkPhoneVerificationCode(phone, parsed.data.code);

  if (!result.approved) {
    return NextResponse.redirect(new URL(`${fallbackPath}?phoneError=Invalid verification code.`, request.url), { status: 303 });
  }

  const verifiedAt = new Date().toISOString();
  await supabase.from("users").update({ phone_number: phone, phone_verified: true, phone_verified_at: verifiedAt }).eq("id", userId);
  await supabase.from(table).update({ phone, phone_number: phone, phone_verified: true, phone_verified_at: verifiedAt }).eq("user_id", userId);
  await supabase.auth.admin.updateUserById(userId, {
    phone,
    user_metadata: { phone_number: phone, phone_verified: true },
  });

  return NextResponse.redirect(new URL(nextPath(parsed.data.role), request.url), { status: 303 });
}

function nextPath(role: "buyer" | "agent") {
  return role === "buyer" ? "/buyer/onboarding/identity" : "/agent/onboarding/license";
}
