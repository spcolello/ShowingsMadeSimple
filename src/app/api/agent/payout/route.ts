import { NextResponse } from "next/server";
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

  const agentId = String(form.get("agentId") ?? "pending-agent");
  const payoutsEnabled = payload.data.payoutsEnabled === "true";
  const supabase = getSupabaseAdmin();

  if (supabase && agentId !== "pending-agent") {
    await supabase.from("agent_profiles").update({
      payout_provider_account_id: payload.data.payoutProviderAccountId,
      payout_setup_status: payoutsEnabled ? "ready" : "pending",
      payouts_enabled: payoutsEnabled,
      agent_onboarding_completed: true,
    }).eq("id", agentId);
  }

  return NextResponse.redirect(new URL("/agent/onboarding/complete", request.url), { status: 303 });
}
