import { distanceMiles, type GeocodedAddress } from "./geocoding";
import { sendSms } from "./sms";
import { getSupabaseAdmin } from "./supabase";

export type AddressShowingStatus =
  | "pending_agent"
  | "agent_accepted_checking_mls"
  | "available_confirmed"
  | "not_available"
  | "reschedule_needed"
  | "completed"
  | "cancelled"
  | "no_agents_found";

export const addressShowingStatusText: Record<AddressShowingStatus, string> = {
  pending_agent: "Looking for an agent in this area.",
  agent_accepted_checking_mls: "An agent accepted and is checking MLS availability.",
  available_confirmed: "The property is available and your showing is being coordinated.",
  not_available: "The property is not available for showing.",
  reschedule_needed: "The agent needs a different time.",
  completed: "Showing completed.",
  cancelled: "Request cancelled.",
  no_agents_found: "No agents are currently available for this area.",
};

type AgentMatchRow = {
  id: string;
  name: string | null;
  phone: string | null;
  users?: { email?: string | null } | { email?: string | null }[] | null;
  service_zips?: string[] | null;
  service_areas?: string[] | null;
  service_radius_miles?: number | null;
  home_lat?: number | string | null;
  home_lng?: number | string | null;
  is_active?: boolean | null;
  is_available?: boolean | null;
};

export function findMatchingAddressAgents(agents: AgentMatchRow[], property: GeocodedAddress) {
  const activeAgents = agents.filter((agent) => agent.is_active !== false && agent.is_available !== false);
  const zipMatches = activeAgents.filter((agent) => {
    const zips = [...(agent.service_zips ?? []), ...(agent.service_areas ?? [])];
    return zips.includes(property.zip);
  });

  if (zipMatches.length > 0) {
    return zipMatches;
  }

  return activeAgents.filter((agent) => {
    if (agent.home_lat == null || agent.home_lng == null) return false;
    const radius = agent.service_radius_miles ?? 15;
    const miles = distanceMiles(property, { lat: Number(agent.home_lat), lng: Number(agent.home_lng) });
    return miles <= radius;
  });
}

export async function notifyAddressShowingAgents(requestId: string, address: string, preferredTime: string, agentIds: string[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase || agentIds.length === 0) {
    return;
  }

  const { data: agents } = await supabase
    .from("agent_profiles")
    .select("id, phone, users(email)")
    .in("id", agentIds);

  const notifications = await Promise.all(
    ((agents ?? []) as Array<{ id: string; phone?: string | null; users?: { email?: string | null } | { email?: string | null }[] | null }>).map(async (agent) => {
      const message = `New showing request: ${address}. Preferred time: ${new Date(preferredTime).toLocaleString()}. Accept to claim and check MLS availability.`;
      const smsResult = agent.phone ? await sendSms(agent.phone, message).catch(() => null) : null;

      return {
      request_id: requestId,
      recipient_type: "agent",
      recipient_agent_id: agent.id,
      recipient_email: Array.isArray(agent.users) ? agent.users[0]?.email : agent.users?.email,
      recipient_phone: agent.phone,
        message,
        status: smsResult ? (smsResult.mocked ? "mocked" : "sent") : "in_app",
      };
    }),
  );

  await supabase.from("address_showing_notifications").insert(notifications);
}

export async function notifyAddressShowingBuyer(requestId: string, email: string, phone: string, message: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const smsResult = phone ? await sendSms(phone, message).catch(() => null) : null;

  await supabase.from("address_showing_notifications").insert({
    request_id: requestId,
    recipient_type: "buyer",
    recipient_email: email,
    recipient_phone: phone,
    message,
    status: smsResult ? (smsResult.mocked ? "mocked" : "sent") : "in_app",
  });
}
