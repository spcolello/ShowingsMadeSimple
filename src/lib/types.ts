export type UserRole = "buyer" | "agent" | "admin";

export type ShowingStatus =
  | "pending"
  | "agent_assigned"
  | "agent_en_route"
  | "completed"
  | "cancelled"
  | "refunded";

export type VerificationStatus = "not_started" | "pending_review" | "approved" | "rejected";
export type AgentApprovalStatus = "pending_review" | "approved" | "rejected" | "suspended";
export type PaymentStatus = "unpaid" | "paid" | "held" | "released" | "refunded" | "failed";
export type DocumentStatus = "pending_review" | "approved" | "verified" | "rejected";
export type DocumentType =
  | "government_id"
  | "selfie"
  | "prequalification_letter"
  | "agent_license"
  | "w9";

export type BuyerProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  identityVerificationStatus: VerificationStatus;
  financialVerificationStatus: VerificationStatus;
  governmentIdFileUrl?: string;
  selfieFileUrl?: string;
  prequalificationLetterUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  softCreditCheckConsent: boolean;
  buyerOnboardingCompleted: boolean;
  suspended: boolean;
  termsAcceptedAt?: string;
};

export type AgentProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  licenseNumber: string;
  licenseState: string;
  licenseExpirationDate: string;
  licenseFileUrl?: string;
  licenseVerificationStatus: VerificationStatus;
  brokerageName: string;
  brokerageAddress: string;
  brokerManagerName: string;
  brokerManagerEmail: string;
  brokerManagerPhone: string;
  brokerageVerificationStatus: VerificationStatus;
  w9FileUrl?: string;
  w9VerificationStatus: VerificationStatus;
  payoutProviderAccountId?: string;
  payoutSetupStatus: "incomplete" | "not_started" | "pending" | "ready";
  payoutsEnabled: boolean;
  agentOnboardingCompleted: boolean;
  approvalStatus: AgentApprovalStatus;
  serviceAreas: string[];
  serviceLocation?: string;
  availableDays: string[];
  availableStartTime: string;
  availableEndTime: string;
  serviceRadiusMiles: number;
  availableHours: string;
  requiredNoticeMinutes: number;
  isAvailable: boolean;
  termsAcceptedAt?: string;
  pendingEarningsCents: number;
  totalEarningsCents: number;
  completedShowingsCount: number;
  acceptanceRate: number;
  averageResponseSeconds: number;
};

export type ShowingRequest = {
  id: string;
  buyerId: string;
  propertyAddress?: string;
  mlsNumber?: string;
  propertySummary: string;
  zipCode: string;
  preferredTime: string;
  safetyNotes: string;
  attendees: number;
  status: ShowingStatus;
  paymentStatus: PaymentStatus;
  showingFeeCents: number;
  agentPayoutCents: number;
  platformFeeCents: number;
  assignedAgentId?: string;
  createdAt: string;
  completedAt?: string;
};

export type VerificationDocument = {
  id: string;
  ownerId: string;
  type: DocumentType;
  uploadedAt: string;
  status: DocumentStatus;
};

export type Payout = {
  id: string;
  showingRequestId: string;
  agentId: string;
  amountCents: number;
  status: "pending" | "released" | "failed";
};

export type SafetyFlag = {
  id: string;
  showingRequestId: string;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved";
  note: string;
};

export type ComplianceLog = {
  id: string;
  actor: string;
  action: string;
  subject: string;
  createdAt: string;
};
