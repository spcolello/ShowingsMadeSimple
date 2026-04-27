import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  action: z.enum([
    "approve_buyer_identity",
    "reject_buyer_identity",
    "approve_buyer_financial",
    "reject_buyer_financial",
    "approve_buyer",
    "reject_buyer",
    "delete_buyer",
    "approve_agent",
    "reject_agent",
    "approve_agent_user",
    "reject_agent_user",
    "delete_agent",
    "suspend_buyer",
    "suspend_agent",
    "override_agent_availability",
    "approve_document",
    "reject_document",
    "reassign_showing",
    "refund_payment",
    "set_payment_status",
    "cancel_showing",
    "mark_showing_complete",
  ]),
  subjectId: z.string().min(1),
  agentId: z.string().optional(),
  paymentStatus: z.enum(["unpaid", "paid", "held", "released", "refunded", "failed"]).optional(),
  isAvailable: z.boolean().optional(),
  serviceRadiusMiles: z.number().optional(),
  availableHours: z.string().optional(),
  note: z.string().optional(),
  returnTo: z.string().optional(),
});

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const rawPayload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries(await request.formData());
  const payload = schema.parse({
    ...rawPayload,
    isAvailable:
      rawPayload.isAvailable === "true" ? true : rawPayload.isAvailable === "false" ? false : rawPayload.isAvailable,
    serviceRadiusMiles: rawPayload.serviceRadiusMiles
      ? Number(rawPayload.serviceRadiusMiles)
      : undefined,
  });
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({
        mocked: true,
        action: payload.action,
        subjectId: payload.subjectId,
        auditLogged: true,
      });
    }
    return NextResponse.redirect(new URL("/admin?action=mocked", request.url), { status: 303 });
  }

  if (payload.action === "approve_buyer_identity" || payload.action === "reject_buyer_identity") {
    await supabase
      .from("buyer_profiles")
      .update({
        identity_verification_status:
          payload.action === "approve_buyer_identity" ? "approved" : "rejected",
      })
      .eq("id", payload.subjectId);
  }

  if (payload.action === "approve_buyer" || payload.action === "reject_buyer") {
    await supabase
      .from("buyer_profiles")
      .update({
        identity_verification_status: payload.action === "approve_buyer" ? "approved" : "rejected",
        financial_verification_status: payload.action === "approve_buyer" ? "approved" : "rejected",
        buyer_onboarding_completed: payload.action === "approve_buyer",
      })
      .eq("id", payload.subjectId);
  }

  if (payload.action === "delete_buyer") {
    const { data: buyer } = await supabase
      .from("buyer_profiles")
      .select("user_id")
      .eq("id", payload.subjectId)
      .maybeSingle();

    if (buyer?.user_id) {
      await supabase.auth.admin.deleteUser(buyer.user_id);
    } else {
      await supabase.from("buyer_profiles").delete().eq("id", payload.subjectId);
    }
  }

  if (payload.action === "approve_buyer_financial" || payload.action === "reject_buyer_financial") {
    await supabase
      .from("buyer_profiles")
      .update({
        financial_verification_status:
          payload.action === "approve_buyer_financial" ? "approved" : "rejected",
      })
      .eq("id", payload.subjectId);
  }

  if (payload.action === "approve_buyer_identity" || payload.action === "approve_buyer_financial") {
    const { data: buyer } = await supabase
      .from("buyer_profiles")
      .select("identity_verification_status, financial_verification_status")
      .eq("id", payload.subjectId)
      .maybeSingle();

    if (
      buyer?.identity_verification_status === "approved" &&
      buyer?.financial_verification_status === "approved"
    ) {
      await supabase
        .from("buyer_profiles")
        .update({ buyer_onboarding_completed: true })
        .eq("id", payload.subjectId);
    }
  }

  if (payload.action === "approve_agent" || payload.action === "reject_agent" || payload.action === "suspend_agent") {
    const approvalStatus =
      payload.action === "approve_agent"
        ? "approved"
        : payload.action === "reject_agent"
          ? "rejected"
          : "suspended";
    await supabase.from("agent_profiles").update({ approval_status: approvalStatus }).eq("id", payload.subjectId);
  }

  if (payload.action === "approve_agent_user" || payload.action === "reject_agent_user") {
    await supabase
      .from("agent_profiles")
      .update({
        license_verification_status: payload.action === "approve_agent_user" ? "approved" : "rejected",
        brokerage_verification_status: payload.action === "approve_agent_user" ? "approved" : "rejected",
        w9_verification_status: payload.action === "approve_agent_user" ? "approved" : "rejected",
        approval_status: payload.action === "approve_agent_user" ? "approved" : "rejected",
        agent_onboarding_completed: payload.action === "approve_agent_user",
      })
      .eq("id", payload.subjectId);
  }

  if (payload.action === "delete_agent") {
    const { data: agent } = await supabase
      .from("agent_profiles")
      .select("user_id")
      .eq("id", payload.subjectId)
      .maybeSingle();

    if (agent?.user_id) {
      await supabase.auth.admin.deleteUser(agent.user_id);
    } else {
      await supabase.from("agent_profiles").delete().eq("id", payload.subjectId);
    }
  }

  if (payload.action === "approve_agent") {
    const { data: agent } = await supabase
      .from("agent_profiles")
      .select("license_verification_status, brokerage_verification_status, w9_verification_status, payout_setup_status, payouts_enabled")
      .eq("id", payload.subjectId)
      .maybeSingle();

    if (
      agent?.license_verification_status === "approved" &&
      agent?.brokerage_verification_status === "approved" &&
      agent?.w9_verification_status === "approved" &&
      agent?.payout_setup_status === "ready" &&
      agent?.payouts_enabled === true
    ) {
      await supabase
        .from("agent_profiles")
        .update({ agent_onboarding_completed: true })
        .eq("id", payload.subjectId);
    }
  }

  if (payload.action === "suspend_buyer") {
    await supabase.from("buyer_profiles").update({ suspended: true }).eq("id", payload.subjectId);
  }

  if (payload.action === "override_agent_availability") {
    await supabase
      .from("agent_profiles")
      .update({
        is_available: payload.isAvailable,
        service_radius_miles: payload.serviceRadiusMiles,
        available_hours: payload.availableHours,
      })
      .eq("id", payload.subjectId);
  }

  if (payload.action === "reassign_showing" && payload.agentId) {
    await supabase
      .from("showing_assignments")
      .upsert({
        showing_request_id: payload.subjectId,
        agent_id: payload.agentId,
        assigned_at: new Date().toISOString(),
      }, { onConflict: "showing_request_id" });
    await supabase.from("showing_requests").update({ status: "agent_assigned" }).eq("id", payload.subjectId);
  }

  if (payload.action === "cancel_showing") {
    await supabase
      .from("showing_requests")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", payload.subjectId);
  }

  if (payload.action === "approve_document" || payload.action === "reject_document") {
    await supabase
      .from("verification_documents")
      .update({
        status: payload.action === "approve_document" ? "approved" : "rejected",
        internal_notes: payload.note,
      })
      .eq("id", payload.subjectId);
  }

  if (payload.action === "refund_payment") {
    const { data: payment } = await supabase
      .from("payments")
      .select("stripe_payment_intent_id, status")
      .eq("showing_request_id", payload.subjectId)
      .maybeSingle();
    const stripe = getStripe();

    if (stripe && payment?.stripe_payment_intent_id && payment.status !== "refunded") {
      await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        metadata: { showingId: payload.subjectId, adminNote: payload.note ?? "" },
      });
    }

    await supabase.from("payments").update({ status: "refunded" }).eq("showing_request_id", payload.subjectId);
    await supabase.from("showing_requests").update({ status: "refunded", payment_status: "refunded" }).eq("id", payload.subjectId);
  }

  if (payload.action === "set_payment_status" && payload.paymentStatus) {
    await supabase
      .from("payments")
      .update({ status: payload.paymentStatus, updated_at: new Date().toISOString() })
      .eq("showing_request_id", payload.subjectId);

    const showingUpdate =
      payload.paymentStatus === "refunded"
        ? { payment_status: payload.paymentStatus, status: "refunded" }
        : { payment_status: payload.paymentStatus };

    await supabase.from("showing_requests").update(showingUpdate).eq("id", payload.subjectId);
  }

  if (payload.action === "mark_showing_complete" && payload.agentId) {
    await supabase.rpc("complete_showing", {
      p_showing_request_id: payload.subjectId,
      p_agent_id: payload.agentId,
    });
  }

  await supabase.from("audit_logs").insert({
    action: payload.action,
    subject_id: payload.subjectId,
    note: payload.note,
  });

  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }

  const returnTo =
    payload.action === "delete_buyer" || payload.action === "delete_agent"
      ? "/admin"
      : payload.returnTo?.startsWith("/")
        ? payload.returnTo
        : "/admin";
  return NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}action=saved`, request.url), {
    status: 303,
  });
}
