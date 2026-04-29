import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyAddressShowingBuyer, type AddressShowingStatus } from "@/lib/address-showings";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["accept", "available_confirmed", "not_available", "reschedule_needed", "completed", "cancelled"]),
});

const buyerMessages: Record<string, string> = {
  accept: "An agent accepted your request and is checking MLS availability.",
  available_confirmed: "The property is available and your showing is being coordinated.",
  not_available: "The property is not available for showing.",
  reschedule_needed: "The agent needs a different time for this showing.",
  completed: "Showing completed.",
  cancelled: "Your showing request was cancelled.",
};

export async function POST(request: Request) {
  const userId = (await cookies()).get("sms_user_id")?.value;
  const role = (await cookies()).get("sms_demo_role")?.value;

  if (!userId || role !== "agent") {
    return NextResponse.redirect(new URL("/login?error=Agent login required.", request.url), { status: 303 });
  }

  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/agent/dashboard?addressAction=invalid", request.url), { status: 303 });
  }

  if (userId.startsWith("mock-")) {
    return NextResponse.redirect(new URL("/agent/dashboard?addressAction=mocked", request.url), { status: 303 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.redirect(new URL("/agent/dashboard?addressAction=missing_config", request.url), { status: 303 });
  }

  const { data: agent } = await supabase.from("agent_profiles").select("id").eq("user_id", userId).maybeSingle();
  if (!agent) {
    return NextResponse.redirect(new URL("/agent/dashboard?addressAction=no_agent", request.url), { status: 303 });
  }

  if (parsed.data.action === "accept") {
    const { data: accepted, error } = await supabase
      .from("address_showing_requests")
      .update({
        assigned_agent_id: agent.id,
        status: "agent_accepted_checking_mls",
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.requestId)
      .eq("status", "pending_agent")
      .is("assigned_agent_id", null)
      .select("buyer_email, buyer_phone")
      .maybeSingle();

    if (error || !accepted) {
      return NextResponse.redirect(new URL("/agent/dashboard?addressAction=claimed", request.url), { status: 303 });
    }

    await notifyAddressShowingBuyer(parsed.data.requestId, accepted.buyer_email, accepted.buyer_phone, buyerMessages.accept);
    return NextResponse.redirect(new URL("/agent/dashboard?addressAction=accepted", request.url), { status: 303 });
  }

  const nextStatus = parsed.data.action as AddressShowingStatus;
  const { data: updated, error } = await supabase
    .from("address_showing_requests")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.requestId)
    .eq("assigned_agent_id", agent.id)
    .select("buyer_email, buyer_phone")
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.redirect(new URL("/agent/dashboard?addressAction=not_assigned", request.url), { status: 303 });
  }

  await notifyAddressShowingBuyer(parsed.data.requestId, updated.buyer_email, updated.buyer_phone, buyerMessages[nextStatus]);
  return NextResponse.redirect(new URL("/agent/dashboard?addressAction=updated", request.url), { status: 303 });
}
