import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  payoutProviderAccountId: z.string().min(3),
  payoutsEnabled: z.string().optional(),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));
  if (!payload.success) {
    return NextResponse.redirect(new URL("/agent/onboarding/payout?error=Invalid payout setup", request.url), { status: 303 });
  }

  const payoutsEnabled = payload.data.payoutsEnabled === "true";
  const supabase = getSupabaseAdmin();
  const userId = (await cookies()).get("sms_user_id")?.value;
  const { data: profile } = supabase && userId
    ? await supabase.from("agent_profiles").select("id").eq("user_id", userId).maybeSingle()
    : { data: null };
  const agentId = profile?.id ?? String(form.get("agentId") ?? "pending-agent");

  if (supabase && agentId !== "pending-agent") {
    await supabase.from("agent_profiles").update({
      payout_provider_account_id: payload.data.payoutProviderAccountId,
      payout_setup_status: payoutsEnabled ? "ready" : "pending",
      payouts_enabled: payoutsEnabled,
    }).eq("id", agentId);
  }

  return NextResponse.redirect(new URL("/agent/onboarding/complete", request.url), { status: 303 });
}
