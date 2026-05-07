import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeUsPhoneNumber } from "@/lib/phone";
import { sendPhoneVerificationCode } from "@/lib/sms";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  role: z.enum(["buyer", "agent"]),
  returnTo: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = (await cookies()).get("sms_user_id")?.value;
  const currentRole = (await cookies()).get("sms_demo_role")?.value;
  const form = Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(form);
  const fallbackPath = parsed.success ? parsed.data.returnTo ?? `/${parsed.data.role}/onboarding/phone` : "/login";

  if (!parsed.success || !userId || currentRole !== parsed.data.role) {
    return NextResponse.redirect(new URL(`${fallbackPath}?phoneError=Login required.`, request.url), { status: 303 });
  }

  if (userId.startsWith("mock-")) {
    return NextResponse.redirect(new URL(`${fallbackPath}?phoneSent=true&mock=true`, request.url), { status: 303 });
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

  try {
    await sendPhoneVerificationCode(phone);
    return NextResponse.redirect(new URL(`${fallbackPath}?phoneSent=true`, request.url), { status: 303 });
  } catch (error) {
    return NextResponse.redirect(
      new URL(`${fallbackPath}?phoneError=${encodeURIComponent(error instanceof Error ? error.message : "Could not send code.")}`, request.url),
      { status: 303 },
    );
  }
}
