import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BuyerPropertyMap } from "@/components/buyer-property-map";
import { BuyerPropertySearch } from "@/components/buyer-property-search";
import { BuyerShowingStatusList } from "@/components/buyer-showing-status-list";
import { AppShell, ButtonLink, Card, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoBuyer, demoShowings } from "@/lib/demo-data";
import { isBuyerReady } from "@/lib/mvp-rules";
import { nextBuyerOnboardingPath } from "@/lib/onboarding-routing";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { BuyerProfile, ShowingRequest } from "@/lib/types";

type BuyerRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email_verified: boolean | null;
  identity_verification_status: BuyerProfile["identityVerificationStatus"] | null;
  financial_verification_status: BuyerProfile["financialVerificationStatus"] | null;
  government_id_file_url: string | null;
  selfie_file_url: string | null;
  prequalification_letter_url: string | null;
  address: BuyerProfile["address"] | null;
  soft_credit_check_consent: boolean | null;
  buyer_onboarding_completed: boolean | null;
  suspended: boolean | null;
  terms_accepted_at: string | null;
  users?: { email?: string | null } | null;
};

type ShowingRow = {
  id: string;
  buyer_id: string;
  property_address: string | null;
  mls_number: string | null;
  property_summary: string | null;
  zip_code: string | null;
  preferred_time: string;
  safety_notes: string | null;
  notes: string | null;
  attendees: number;
  status: string;
  payment_status: string;
  showing_fee_cents: number;
  agent_payout_cents: number | null;
  platform_fee_cents: number | null;
  requested_at: string;
  completed_at: string | null;
};

type AssignmentRow = {
  showing_request_id: string;
  agent_id: string;
};

type AgentRow = {
  id: string;
  name: string | null;
};

const emptyAddress = { street: "", city: "", state: "", zipCode: "" };

function mapShowingStatus(status: string): ShowingRequest["status"] {
  if (status === "assigned") return "agent_assigned";
  if (status === "draft" || status === "payment_pending" || status === "paid" || status === "searching_for_agent") {
    return "pending";
  }
  if (["agent_assigned", "agent_en_route", "completed", "cancelled", "refunded"].includes(status)) {
    return status as ShowingRequest["status"];
  }
  return "pending";
}

function mapPaymentStatus(status: string): ShowingRequest["paymentStatus"] {
  if (["unpaid", "paid", "held", "released", "refunded", "failed"].includes(status)) {
    return status as ShowingRequest["paymentStatus"];
  }
  return "unpaid";
}

function mapBuyer(row: BuyerRow): BuyerProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? "Buyer",
    email: row.users?.email ?? "",
    phone: row.phone ?? "",
    emailVerified: row.email_verified === true,
    identityVerificationStatus: row.identity_verification_status ?? "not_started",
    financialVerificationStatus: row.financial_verification_status ?? "not_started",
    governmentIdFileUrl: row.government_id_file_url ?? undefined,
    selfieFileUrl: row.selfie_file_url ?? undefined,
    prequalificationLetterUrl: row.prequalification_letter_url ?? undefined,
    address: row.address ?? emptyAddress,
    softCreditCheckConsent: row.soft_credit_check_consent === true,
    buyerOnboardingCompleted: row.buyer_onboarding_completed === true,
    suspended: row.suspended === true,
    termsAcceptedAt: row.terms_accepted_at ?? undefined,
  };
}

function mapShowings(rows: ShowingRow[], assignments: AssignmentRow[]): ShowingRequest[] {
  return rows.map((row) => {
    const assignment = assignments.find((item) => item.showing_request_id === row.id);

    return {
      id: row.id,
      buyerId: row.buyer_id,
      propertyAddress: row.property_address ?? undefined,
      mlsNumber: row.mls_number ?? undefined,
      propertySummary: row.property_summary ?? "Buyer-entered property details",
      zipCode: row.zip_code ?? "",
      preferredTime: row.preferred_time,
      safetyNotes: row.safety_notes ?? row.notes ?? "",
      attendees: row.attendees,
      status: mapShowingStatus(row.status),
      paymentStatus: mapPaymentStatus(row.payment_status),
      showingFeeCents: row.showing_fee_cents,
      agentPayoutCents: row.agent_payout_cents ?? 6000,
      platformFeeCents: row.platform_fee_cents ?? 1500,
      assignedAgentId: assignment?.agent_id,
      createdAt: row.requested_at,
      completedAt: row.completed_at ?? undefined,
    };
  });
}

async function loadDashboardData() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("sms_user_id")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (userId.startsWith("mock-")) {
    return {
      buyer: demoBuyer,
      showings: demoShowings,
      agentsById: new Map(demoAgents.map((agent) => [agent.id, agent.name])),
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    redirect("/login?error=Supabase is not configured.");
  }

  const { data: buyerRow } = await supabase
    .from("buyer_profiles")
    .select("*, users(email)")
    .eq("user_id", userId)
    .maybeSingle<BuyerRow>();

  if (!buyerRow) {
    redirect("/buyer/onboarding");
  }

  const nextPath = nextBuyerOnboardingPath(buyerRow);
  if (nextPath !== "/buyer/dashboard") {
    redirect(nextPath);
  }

  const { data: rawShowingRows } = await supabase
    .from("showing_requests")
    .select("*")
    .eq("buyer_id", buyerRow.id)
    .order("requested_at", { ascending: false })
    .returns<ShowingRow[]>();
  const showingRows = rawShowingRows ?? [];

  const showingIds = showingRows.map((showing) => showing.id);
  const { data: rawAssignments } = showingIds.length
    ? await supabase
        .from("showing_assignments")
        .select("showing_request_id, agent_id")
        .in("showing_request_id", showingIds)
        .returns<AssignmentRow[]>()
    : { data: [] as AssignmentRow[] };
  const assignments = rawAssignments ?? [];

  const agentIds = [...new Set(assignments.map((assignment) => assignment.agent_id))];
  const { data: rawAgentRows } = agentIds.length
    ? await supabase.from("agent_profiles").select("id, name").in("id", agentIds).returns<AgentRow[]>()
    : { data: [] as AgentRow[] };
  const agentRows = rawAgentRows ?? [];

  return {
    buyer: mapBuyer(buyerRow),
    showings: mapShowings(showingRows, assignments),
    agentsById: new Map(agentRows.map((agent) => [agent.id, agent.name ?? "Assigned agent"])),
  };
}

function BuyerDashboardTabs({ activeTab }: { activeTab: "overview" | "properties" | "request" }) {
  const tabs = [
    ["overview", "Overview"],
    ["properties", "Property search"],
    ["request", "Request by MLS/address"],
  ] as const;

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {tabs.map(([tab, label]) => (
        <Link
          key={tab}
          href={tab === "overview" ? "/buyer/dashboard" : `/buyer/dashboard?tab=${tab}`}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            activeTab === tab
              ? "bg-teal-700 text-white"
              : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

function ManualShowingRequestPanel({
  error,
  payment,
}: {
  error?: string;
  payment?: string;
}) {
  return (
    <Section className="max-w-3xl pt-0">
      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {payment === "cancelled" && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Payment was cancelled. Your showing request is not ready for agent matching until payment is completed.
        </p>
      )}
      <Card>
        <h1 className="text-2xl font-semibold">Search by MLS or address</h1>
        <p className="mt-2 text-sm text-slate-600">
          Search seeded properties by MLS number or address, then request a showing from the matching property.
        </p>
        <div className="mt-6">
          <BuyerPropertySearch />
        </div>
      </Card>
    </Section>
  );
}

export default async function BuyerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; payment?: string }>;
}) {
  const params = await searchParams;
  const activeTab =
    params.tab === "properties" ? "properties" : params.tab === "request" ? "request" : "overview";

  if (activeTab === "properties") {
    await loadDashboardData();
    return (
      <AppShell>
        <Section className="pb-4">
          <BuyerDashboardTabs activeTab="properties" />
        </Section>
        <BuyerPropertyMap mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />
      </AppShell>
    );
  }

  if (activeTab === "request") {
    await loadDashboardData();
    return (
      <AppShell>
        <Section className="pb-4">
          <BuyerDashboardTabs activeTab="request" />
        </Section>
        <ManualShowingRequestPanel error={params.error} payment={params.payment} />
      </AppShell>
    );
  }

  const { buyer, showings, agentsById } = await loadDashboardData();
  const buyerReady = isBuyerReady(buyer);
  const missingSteps = [
    !buyer.emailVerified ? "Verify email" : null,
    buyer.identityVerificationStatus !== "approved" ? "Identity approval" : null,
    buyer.financialVerificationStatus !== "approved" ? "Financial approval" : null,
    !buyer.buyerOnboardingCompleted ? "Complete onboarding" : null,
  ].filter(Boolean);

  return (
    <AppShell>
      <Section>
        <BuyerDashboardTabs activeTab="overview" />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-700">Buyer dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold">{buyer.fullName}</h1>
            <p className="mt-2 text-slate-600">
              Identity: {buyer.identityVerificationStatus}. Financial: {buyer.financialVerificationStatus}.
            </p>
          </div>
          {buyerReady ? (
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/buyer/dashboard?tab=properties">Search properties</ButtonLink>
              <ButtonLink href="/buyer/dashboard?tab=request" variant="secondary">Request by MLS/address</ButtonLink>
            </div>
          ) : (
            <ButtonLink href="/buyer/onboarding" variant="secondary">
              Finish verification
            </ButtonLink>
          )}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Card>
            <p className="text-sm text-slate-500">Email</p>
            <div className="mt-3">
              <StatusBadge status={buyer.emailVerified ? "verified" : "not_verified"} />
            </div>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Identity</p>
            <div className="mt-3">
              <StatusBadge status={buyer.identityVerificationStatus} />
            </div>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Financial</p>
            <div className="mt-3">
              <StatusBadge status={buyer.financialVerificationStatus} />
            </div>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Showing access</p>
            <p className="mt-2 text-xl font-semibold">{buyerReady ? "Unlocked" : "Blocked"}</p>
          </Card>
        </div>

        {!buyerReady && (
          <Card className="mt-4">
            <h2 className="font-semibold">Missing steps</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {missingSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">Pending requests</p>
            <p className="mt-2 text-3xl font-semibold">
              {showings.filter((showing) => showing.status !== "completed").length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Past showings</p>
            <p className="mt-2 text-3xl font-semibold">
              {showings.filter((showing) => showing.status === "completed").length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Payment status</p>
            <p className="mt-2 text-3xl font-semibold">
              {showings.some((showing) => showing.paymentStatus === "failed" || showing.paymentStatus === "unpaid")
                ? "Action needed"
                : "Current"}
            </p>
          </Card>
        </div>

        <Card className="mt-8">
          <h2 className="text-lg font-semibold">Showing status tracking</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["pending", "Request received; waiting for an agent."],
              ["agent_assigned", "An agent accepted the showing."],
              ["agent_en_route", "The agent is on the way."],
              ["completed", "Showing has been completed."],
            ].map(([status, description]) => (
              <div key={status} className="rounded-md border border-slate-200 p-3">
                <StatusBadge status={status} />
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </Card>

        <BuyerShowingStatusList
          initialShowings={showings.map((showing) => ({
            id: showing.id,
            propertyAddress: showing.propertyAddress,
            mlsNumber: showing.mlsNumber,
            zipCode: showing.zipCode,
            preferredTime: showing.preferredTime,
            status: showing.status,
            paymentStatus: showing.paymentStatus,
            showingFeeCents: showing.showingFeeCents,
            assignedAgentId: showing.assignedAgentId,
            agentName: showing.assignedAgentId ? agentsById.get(showing.assignedAgentId) ?? null : null,
          }))}
        />
      </Section>
    </AppShell>
  );
}
