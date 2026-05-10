import { demoAgents, demoShowings, matchingAgentsForZip } from "./demo-data";
import { env } from "./env";
import { canBroadcastShowing } from "./mvp-rules";
import { sendSms } from "./sms";
import { getSupabaseAdmin } from "./supabase";

type ShowingInput = {
  buyerId?: string;
  propertyAddress: string;
  mlsNumber?: string;
  propertySummary: string;
  zipCode: string;
  preferredTime: string;
  safetyNotes?: string;
  attendees: number;
  seriousInterest: boolean;
};

export async function createShowingRequest(input: ShowingInput) {
  if (!input.seriousInterest) {
    throw new Error("Buyer must confirm serious interest before requesting a showing.");
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const { demoBuyer } = await import("./demo-data");
    const { isBuyerReady } = await import("./mvp-rules");
    if (!isBuyerReady(demoBuyer)) {
      throw new Error("Buyer verification must be approved before requesting showings.");
    }
    return {
      id: "local-new-showing",
      status: "pending",
      paymentStatus: "unpaid",
      ...input,
    };
  }

  if (!input.buyerId) {
    throw new Error("Buyer profile is required before requesting showings.");
  }

  const { data, error } = await supabase
    .from("buyer_profiles")
    .select("email_verified, phone_verified, identity_verification_status, financial_verification_status, buyer_onboarding_completed, suspended")
    .eq("id", input.buyerId)
    .single();

  if (error) {
    throw error;
  }

  if (
    !data.email_verified ||
    (env.requirePhoneVerification && !data.phone_verified) ||
    data.identity_verification_status !== "approved" ||
    data.financial_verification_status !== "approved" ||
    !data.buyer_onboarding_completed ||
    data.suspended
  ) {
    throw new Error("Buyer verification must be approved before requesting showings.");
  }

  const { data: createdShowing, error: showingError } = await supabase
    .from("showing_requests")
    .insert({
      buyer_id: input.buyerId,
      property_address: input.propertyAddress,
      mls_number: input.mlsNumber,
      property_summary: input.propertySummary,
      zip_code: input.zipCode,
      preferred_time: input.preferredTime,
      safety_notes: input.safetyNotes,
      attendees: input.attendees,
      serious_interest_confirmed: input.seriousInterest,
      status: "pending",
      payment_status: "unpaid",
      showing_fee_cents: 3000,
      agent_payout_cents: 2500,
      platform_fee_cents: 500,
    })
    .select()
    .single();

  if (showingError) {
    throw showingError;
  }

  await supabase.from("compliance_logs").insert({
    actor_user_id: input.buyerId,
    action: "Showing requested",
    subject_table: "showing_requests",
    subject_id: createdShowing.id,
  });

  return createdShowing;
}

export async function notifyMatchingAgents(showingId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const showing = demoShowings.find((item) => item.id === showingId) ?? demoShowings[0];
    if (!canBroadcastShowing(showing)) {
      return { matchedAgents: 0, notifications: [], blocked: "Payment must be held before broadcast." };
    }
    const agents = matchingAgentsForZip(showing.zipCode);
    const results = await Promise.all(
      agents.map((agent) =>
        sendSms(
          agent.phone,
          `New showing request at ${showing.propertyAddress}. Accept: ${env.appUrl}/agent/accept/${showing.id}?agent=${agent.id}`,
        ),
      ),
    );
    return { matchedAgents: agents.length, notifications: results };
  }

  const { data: showing, error: showingError } = await supabase
    .from("showing_requests")
    .select("*")
    .eq("id", showingId)
    .single();

  if (showingError) {
    throw showingError;
  }

  if (showing.payment_status !== "held") {
    return { matchedAgents: 0, notifications: [], blocked: "Payment must be held before broadcast." };
  }

  const { data: agents, error } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("approval_status", "approved")
    .eq("is_available", true)
    .contains("service_areas", [showing.zip_code]);

  if (error) {
    throw error;
  }

  const notifications = await Promise.all(
    (agents ?? []).map(async (agent) => {
      const acceptUrl = `${env.appUrl}/agent/accept/${showingId}?agent=${agent.id}`;
      const body = `New showing request at ${showing.property_address}. Accept: ${acceptUrl}`;
      const result = agent.phone
        ? await sendSms(agent.phone, body).catch((error) => ({
            mocked: false,
            sid: null,
            error: error instanceof Error ? error.message : "SMS failed.",
          }))
        : { mocked: false, sid: null, error: "Agent phone is missing." };

      await supabase.from("sms_notifications").insert({
        showing_request_id: showingId,
        agent_id: agent.id,
        phone: agent.phone,
        body,
        provider_sid: result.sid,
        status: "error" in result ? "failed" : result.mocked ? "mocked" : "sent",
      });

      return result;
    }),
  );

  await supabase
    .from("showing_requests")
    .update({ status: "pending" })
    .eq("id", showingId);

  return { matchedAgents: agents?.length ?? 0, notifications };
}

export async function acceptShowingRequest(showingId: string, agentId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const showing = demoShowings.find((item) => item.id === showingId);
    if (!showing || showing.assignedAgentId || showing.status !== "pending") {
      return { accepted: false, message: "This showing has already been claimed." };
    }
    const agent = demoAgents.find((item) => item.id === agentId) ?? demoAgents[0];
    return { accepted: true, agent, message: "You are assigned to this showing." };
  }

  const { data: agent, error: agentError } = await supabase
    .from("agent_profiles")
    .select("phone_verified, approval_status")
    .eq("id", agentId)
    .maybeSingle();

  if (agentError) {
    throw agentError;
  }

  if (!agent || agent.approval_status !== "approved" || (env.requirePhoneVerification && !agent.phone_verified)) {
    return {
      accepted: false,
      message: env.requirePhoneVerification
        ? "Agent approval and phone verification are required before accepting showings."
        : "Agent approval is required before accepting showings.",
    };
  }

  const { data, error } = await supabase.rpc("accept_showing_request", {
    p_showing_request_id: showingId,
    p_agent_id: agentId,
  });

  if (error) {
    throw error;
  }

  const accepted = data as { accepted: boolean; message: string };
  if (accepted.accepted) {
    await supabase
      .from("showing_requests")
      .update({ assigned_agent_id: agentId, status: "agent_assigned" })
      .eq("id", showingId);
  }

  return accepted;
}

export async function completeShowing(showingId: string, agentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { completed: true, payoutStatus: "released", pendingEarningsCents: 2500 };
  }

  const { error } = await supabase.rpc("complete_showing", {
    p_showing_request_id: showingId,
    p_agent_id: agentId,
  });

  if (error) {
    throw error;
  }

  const { data: showing } = await supabase
    .from("showing_requests")
    .select("agent_payout_cents")
    .eq("id", showingId)
    .maybeSingle();

  await supabase.from("payouts").upsert({
    showing_request_id: showingId,
    agent_id: agentId,
    amount_cents: showing?.agent_payout_cents ?? 2500,
    status: "pending",
  }, { onConflict: "showing_request_id,agent_id" });

  return { completed: true };
}
