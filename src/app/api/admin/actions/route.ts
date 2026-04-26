import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  action: z.enum([
    "approve_buyer_identity",
    "reject_buyer_identity",
    "approve_buyer_financial",
    "reject_buyer_financial",
    "approve_agent",
    "reject_agent",
    "suspend_buyer",
    "suspend_agent",
    "override_agent_availability",
    "approve_document",
    "reject_document",
    "reassign_showing",
    "refund_payment",
    "mark_showing_complete",
  ]),
  subjectId: z.string().min(1),
  agentId: z.string().optional(),
  isAvailable: z.boolean().optional(),
  serviceRadiusMiles: z.number().optional(),
  availableHours: z.string().optional(),
  note: z.string().optional(),
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

  if (payload.action === "approve_buyer_financial" || payload.action === "reject_buyer_financial") {
    await supabase
      .from("buyer_profiles")
      .update({
        financial_verification_status:
          payload.action === "approve_buyer_financial" ? "approved" : "rejected",
      })
      .eq("id", payload.subjectId);
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

  if (payload.action === "approve_document" || payload.action === "reject_document") {
    await supabase
      .from("verification_documents")
      .update({ status: payload.action === "approve_document" ? "approved" : "rejected" })
      .eq("id", payload.subjectId);
  }

  if (payload.action === "refund_payment") {
    await supabase.from("payments").update({ status: "refunded" }).eq("showing_request_id", payload.subjectId);
    await supabase.from("showing_requests").update({ status: "refunded", payment_status: "refunded" }).eq("id", payload.subjectId);
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

  return NextResponse.redirect(new URL("/admin?action=saved", request.url), { status: 303 });
}
