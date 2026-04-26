import type { AgentProfile, BuyerProfile, ComplianceLog, ShowingRequest } from "./types";

export const demoBuyer: BuyerProfile = {
  id: "buyer-demo",
  fullName: "Maya Johnson",
  email: "maya@example.com",
  phone: "+15551201010",
  verificationStatus: "approved",
  termsAcceptedAt: "2026-04-24T14:20:00Z",
};

export const demoAgents: AgentProfile[] = [
  {
    id: "agent-sam",
    name: "Sam Rivera",
    phone: "+15551201111",
    licenseNumber: "FL-347812",
    licensedState: "FL",
    serviceAreas: ["33131", "33132", "33133"],
    available: true,
    verified: true,
    termsAcceptedAt: "2026-04-23T16:00:00Z",
    pendingEarningsCents: 12000,
  },
  {
    id: "agent-alex",
    name: "Alex Chen",
    phone: "+15551202222",
    licenseNumber: "FL-883104",
    licensedState: "FL",
    serviceAreas: ["33131", "33139"],
    available: true,
    verified: true,
    termsAcceptedAt: "2026-04-21T09:45:00Z",
    pendingEarningsCents: 6000,
  },
  {
    id: "agent-riley",
    name: "Riley Brooks",
    phone: "+15551203333",
    licenseNumber: "FL-119940",
    licensedState: "FL",
    serviceAreas: ["33145"],
    available: false,
    verified: false,
    pendingEarningsCents: 0,
  },
];

export const demoShowings: ShowingRequest[] = [
  {
    id: "demo-showing-1",
    buyerId: "buyer-demo",
    propertyAddress: "88 Brickell Plaza, Miami, FL",
    zipCode: "33131",
    preferredTime: "2026-04-27T15:30:00-04:00",
    notes: "Buyer wants to compare natural light and parking access.",
    attendees: 2,
    status: "searching_for_agent",
    paymentStatus: "paid",
    showingFeeCents: 7500,
    createdAt: "2026-04-26T10:15:00Z",
  },
  {
    id: "demo-showing-2",
    buyerId: "buyer-demo",
    propertyAddress: "2100 Biscayne Blvd, Miami, FL",
    zipCode: "33137",
    preferredTime: "2026-04-28T11:00:00-04:00",
    notes: "Needs a quick lunch-hour appointment.",
    attendees: 1,
    status: "assigned",
    paymentStatus: "paid",
    showingFeeCents: 7500,
    assignedAgentId: "agent-sam",
    createdAt: "2026-04-25T17:30:00Z",
  },
  {
    id: "demo-showing-3",
    buyerId: "buyer-demo",
    propertyAddress: "456 Coral Way, Coral Gables, FL",
    zipCode: "33134",
    preferredTime: "2026-04-22T13:00:00-04:00",
    notes: "Completed showing. Buyer requested follow-up comps.",
    attendees: 2,
    status: "completed",
    paymentStatus: "paid",
    showingFeeCents: 7500,
    assignedAgentId: "agent-alex",
    createdAt: "2026-04-20T12:00:00Z",
    completedAt: "2026-04-22T14:05:00Z",
  },
];

export const demoComplianceLogs: ComplianceLog[] = [
  {
    id: "log-1",
    actor: "buyer-demo",
    action: "Buyer verification submitted",
    subject: "buyer_profiles",
    createdAt: "2026-04-24T14:18:00Z",
  },
  {
    id: "log-2",
    actor: "agent-sam",
    action: "Agent accepted showing terms",
    subject: "agent_profiles",
    createdAt: "2026-04-23T16:00:00Z",
  },
  {
    id: "log-3",
    actor: "system",
    action: "Payment completed and SMS matching started",
    subject: "demo-showing-1",
    createdAt: "2026-04-26T10:16:00Z",
  },
];

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function matchingAgentsForZip(zipCode: string) {
  return demoAgents.filter(
    (agent) =>
      agent.verified &&
      agent.available &&
      agent.phone &&
      agent.serviceAreas.includes(zipCode),
  );
}
