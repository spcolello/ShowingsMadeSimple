export type UserRole = "buyer" | "agent" | "admin";

export type ShowingStatus =
  | "draft"
  | "payment_pending"
  | "paid"
  | "searching_for_agent"
  | "assigned"
  | "completed"
  | "cancelled"
  | "disputed";

export type VerificationStatus = "not_started" | "submitted" | "approved" | "rejected";

export type BuyerProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  verificationStatus: VerificationStatus;
  termsAcceptedAt?: string;
};

export type AgentProfile = {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licensedState: string;
  serviceAreas: string[];
  available: boolean;
  verified: boolean;
  termsAcceptedAt?: string;
  pendingEarningsCents: number;
};

export type ShowingRequest = {
  id: string;
  buyerId: string;
  propertyAddress: string;
  zipCode: string;
  preferredTime: string;
  notes: string;
  attendees: number;
  status: ShowingStatus;
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded";
  showingFeeCents: number;
  assignedAgentId?: string;
  createdAt: string;
  completedAt?: string;
};

export type ComplianceLog = {
  id: string;
  actor: string;
  action: string;
  subject: string;
  createdAt: string;
};
