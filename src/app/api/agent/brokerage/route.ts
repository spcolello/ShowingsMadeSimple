import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  brokerageName: z.string().min(2),
  brokerageAddress: z.string().min(5),
  brokerManagerName: z.string().min(2),
  brokerManagerEmail: z.string().email(),
  brokerManagerPhone: z.string().min(7),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));
  if (!payload.success) {
    return NextResponse.redirect(new URL("/agent/onboarding/brokerage?error=Invalid brokerage information", request.url), { status: 303 });
  }

  const agentId = String(form.get("agentId") ?? "pending-agent");
  const supabase = getSupabaseAdmin();
  if (supabase && agentId !== "pending-agent") {
    await supabase.from("agent_profiles").update({
      brokerage_name: payload.data.brokerageName,
      brokerage_address: payload.data.brokerageAddress,
      broker_manager_name: payload.data.brokerManagerName,
      broker_manager_email: payload.data.brokerManagerEmail,
      broker_manager_phone: payload.data.brokerManagerPhone,
      brokerage_verification_status: "pending_review",
    }).eq("id", agentId);
  }

  return NextResponse.redirect(new URL("/agent/onboarding/tax", request.url), { status: 303 });
}
