import type {
  AgentProfile,
  BuyerProfile,
  ComplianceLog,
  Payout,
  SafetyFlag,
  ShowingRequest,
  VerificationDocument,
} from "./types";
import { findEligibleAgents } from "./mvp-rules";

export const demoBuyer: BuyerProfile = {
  id: "buyer-demo",
  fullName: "Maya Johnson",
  email: "maya@example.com",
  phone: "+15551201010",
  identityVerificationStatus: "verified",
  financialVerificationStatus: "verified",
  addressConfirmation: "1200 Brickell Bay Dr, Miami, FL 33131",
  suspended: false,
  termsAcceptedAt: "2026-04-24T14:20:00Z",
};

export const demoAgents: AgentProfile[] = [
  {
    id: "agent-sam",
    name: "Sam Rivera",
    phone: "+15551201111",
    licenseNumber: "FL-347812",
    licensedState: "FL",
    brokerageName: "Harbor Realty",
    brokerageVerificationStatus: "verified",
    w9Status: "verified",
    payoutSetupStatus: "ready",
    approvalStatus: "approved",
    serviceAreas: ["33131", "33132", "33133"],
    serviceRadiusMiles: 12,
    availableHours: "Mon-Fri 9:00 AM-6:00 PM",
    requiredNoticeMinutes: 60,
    available: true,
    termsAcceptedAt: "2026-04-23T16:00:00Z",
    pendingEarningsCents: 12000,
    acceptanceRate: 0.92,
    averageResponseSeconds: 48,
  },
  {
    id: "agent-alex",
    name: "Alex Chen",
    phone: "+15551202222",
    licenseNumber: "FL-883104",
    licensedState: "FL",
    brokerageName: "Downtown Homes",
    brokerageVerificationStatus: "verified",
    w9Status: "verified",
    payoutSetupStatus: "ready",
    approvalStatus: "approved",
    serviceAreas: ["33131", "33139"],
    serviceRadiusMiles: 8,
    availableHours: "Daily 10:00 AM-5:00 PM",
    requiredNoticeMinutes: 90,
    available: true,
    termsAcceptedAt: "2026-04-21T09:45:00Z",
    pendingEarningsCents: 6000,
    acceptanceRate: 0.85,
    averageResponseSeconds: 40,
  },
  {
    id: "agent-riley",
    name: "Riley Brooks",
    phone: "+15551203333",
    licenseNumber: "FL-119940",
    licensedState: "FL",
    brokerageName: "Pending Brokerage",
    brokerageVerificationStatus: "pending_review",
    w9Status: "pending_review",
    payoutSetupStatus: "not_started",
    approvalStatus: "pending_review",
    serviceAreas: ["33145"],
    serviceRadiusMiles: 10,
    availableHours: "Weekends",
    requiredNoticeMinutes: 120,
    available: false,
    pendingEarningsCents: 0,
    acceptanceRate: 0,
    averageResponseSeconds: 0,
  },
];

export const demoShowings: ShowingRequest[] = [
  {
    id: "demo-showing-1",
    buyerId: "buyer-demo",
    propertyAddress: "88 Brickell Plaza, Miami, FL",
    mlsNumber: "A11550123",
    propertySummary: "2 bed condo, buyer-entered info only",
    zipCode: "33131",
    preferredTime: "2026-04-29T15:30:00-04:00",
    safetyNotes: "Buyer wants to compare natural light and parking access.",
    attendees: 2,
    status: "pending",
    paymentStatus: "held",
    showingFeeCents: 7500,
    agentPayoutCents: 6000,
    platformFeeCents: 1500,
    createdAt: "2026-04-26T10:15:00Z",
  },
  {
    id: "demo-showing-2",
    buyerId: "buyer-demo",
    propertyAddress: "2100 Biscayne Blvd, Miami, FL",
    propertySummary: "Townhome, buyer-entered property details",
    zipCode: "33137",
    preferredTime: "2026-04-28T11:00:00-04:00",
    safetyNotes: "Needs a quick lunch-hour appointment.",
    attendees: 1,
    status: "agent_assigned",
    paymentStatus: "held",
    showingFeeCents: 7500,
    agentPayoutCents: 6000,
    platformFeeCents: 1500,
    assignedAgentId: "agent-sam",
    createdAt: "2026-04-25T17:30:00Z",
  },
  {
    id: "demo-showing-3",
    buyerId: "buyer-demo",
    propertyAddress: "456 Coral Way, Coral Gables, FL",
    propertySummary: "Single-family home, buyer-entered info only",
    zipCode: "33134",
    preferredTime: "2026-04-22T13:00:00-04:00",
    safetyNotes: "Completed showing. Buyer requested follow-up comps.",
    attendees: 2,
    status: "completed",
    paymentStatus: "released",
    showingFeeCents: 7500,
    agentPayoutCents: 6000,
    platformFeeCents: 1500,
    assignedAgentId: "agent-alex",
    createdAt: "2026-04-20T12:00:00Z",
    completedAt: "2026-04-22T14:05:00Z",
  },
];

export const demoDocuments: VerificationDocument[] = [
  {
    id: "doc-1",
    ownerId: "buyer-demo",
    type: "government_id",
    uploadedAt: "2026-04-24T14:00:00Z",
    status: "verified",
  },
  {
    id: "doc-2",
    ownerId: "buyer-demo",
    type: "selfie",
    uploadedAt: "2026-04-24T14:01:00Z",
    status: "verified",
  },
  {
    id: "doc-3",
    ownerId: "buyer-demo",
    type: "prequalification_letter",
    uploadedAt: "2026-04-24T14:02:00Z",
    status: "verified",
  },
  {
    id: "doc-4",
    ownerId: "agent-sam",
    type: "agent_license",
    uploadedAt: "2026-04-23T15:45:00Z",
    status: "verified",
  },
  {
    id: "doc-5",
    ownerId: "agent-sam",
    type: "w9",
    uploadedAt: "2026-04-23T15:46:00Z",
    status: "verified",
  },
];

export const demoPayouts: Payout[] = [
  {
    id: "payout-1",
    showingRequestId: "demo-showing-3",
    agentId: "agent-alex",
    amountCents: 6000,
    status: "released",
  },
  {
    id: "payout-2",
    showingRequestId: "demo-showing-2",
    agentId: "agent-sam",
    amountCents: 6000,
    status: "pending",
  },
];

export const demoSafetyFlags: SafetyFlag[] = [
  {
    id: "flag-1",
    showingRequestId: "demo-showing-2",
    severity: "low",
    status: "open",
    note: "Admin to confirm property access instructions before appointment.",
  },
];

export const demoComplianceLogs: ComplianceLog[] = [
  {
    id: "log-1",
    actor: "buyer-demo",
    action: "Buyer identity and financial verification approved",
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
    action: "Payment held and eligible agents broadcast",
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

export function matchingAgentsForZip(zipCode: string): AgentProfile[] {
  const showing = demoShowings.find((item) => item.zipCode === zipCode) ?? demoShowings[0];
  return findEligibleAgents(demoAgents, showing, new Date("2026-04-26T12:00:00Z"));
}
