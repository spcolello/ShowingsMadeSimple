import { demoAgents, demoShowings, matchingAgentsForZip } from "./demo-data";
import { env } from "./env";
import { sendSms } from "./sms";
import { getSupabaseAdmin } from "./supabase";

type ShowingInput = {
  buyerId?: string;
  propertyAddress: string;
  zipCode: string;
  preferredTime: string;
  notes?: string;
  attendees: number;
  seriousInterest: boolean;
};

export async function createShowingRequest(input: ShowingInput) {
  if (!input.seriousInterest) {
    throw new Error("Buyer must confirm serious interest before requesting a showing.");
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      id: "local-new-showing",
      status: "payment_pending",
      paymentStatus: "pending",
      ...input,
    };
  }

  const { data, error } = await supabase
    .from("showing_requests")
    .insert({
      buyer_id: input.buyerId,
      property_address: input.propertyAddress,
      zip_code: input.zipCode,
      preferred_time: input.preferredTime,
      notes: input.notes,
      attendees: input.attendees,
      status: "payment_pending",
      payment_status: "pending",
      showing_fee_cents: 7500,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("compliance_logs").insert({
    actor_user_id: input.buyerId,
    action: "Showing requested",
    subject_table: "showing_requests",
    subject_id: data.id,
  });

  return data;
}

export async function notifyMatchingAgents(showingId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const showing = demoShowings.find((item) => item.id === showingId) ?? demoShowings[0];
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

  const { data: agents, error } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("verified", true)
    .eq("available", true)
    .contains("service_areas", [showing.zip_code])
    .not("phone", "is", null);

  if (error) {
    throw error;
  }

  const notifications = await Promise.all(
    (agents ?? []).map(async (agent) => {
      const acceptUrl = `${env.appUrl}/agent/accept/${showingId}?agent=${agent.id}`;
      const result = await sendSms(
        agent.phone,
        `New showing request at ${showing.property_address}. Accept: ${acceptUrl}`,
      );

      await supabase.from("sms_notifications").insert({
        showing_request_id: showingId,
        agent_id: agent.id,
        phone: agent.phone,
        body: `New showing request at ${showing.property_address}. Accept: ${acceptUrl}`,
        provider_sid: result.sid,
        status: result.mocked ? "mocked" : "sent",
      });

      return result;
    }),
  );

  await supabase
    .from("showing_requests")
    .update({ status: "searching_for_agent" })
    .eq("id", showingId);

  return { matchedAgents: agents?.length ?? 0, notifications };
}

export async function acceptShowingRequest(showingId: string, agentId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const showing = demoShowings.find((item) => item.id === showingId);
    if (!showing || showing.assignedAgentId || showing.status === "assigned") {
      return { accepted: false, message: "This showing has already been claimed." };
    }
    const agent = demoAgents.find((item) => item.id === agentId) ?? demoAgents[0];
    return { accepted: true, agent, message: "You are assigned to this showing." };
  }

  const { data, error } = await supabase.rpc("accept_showing_request", {
    p_showing_request_id: showingId,
    p_agent_id: agentId,
  });

  if (error) {
    throw error;
  }

  return data as { accepted: boolean; message: string };
}

export async function completeShowing(showingId: string, agentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { completed: true, pendingEarningsCents: 6000 };
  }

  const { error } = await supabase.rpc("complete_showing", {
    p_showing_request_id: showingId,
    p_agent_id: agentId,
  });

  if (error) {
    throw error;
  }

  return { completed: true };
}
