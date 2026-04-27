import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell, ButtonLink, Card, Field, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoBuyer, demoPayouts, demoShowings, formatMoney, matchingAgentsForZip } from "@/lib/demo-data";
import { isAgentReady } from "@/lib/mvp-rules";
import { nextAgentOnboardingPath } from "@/lib/onboarding-routing";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { AgentProfile, BuyerProfile, Payout, ShowingRequest } from "@/lib/types";

type AgentRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email_verified: boolean | null;
  license_number: string | null;
  license_state: string | null;
  licensed_state: string | null;
  license_expiration_date: string | null;
  license_file_url: string | null;
  license_verification_status: AgentProfile["licenseVerificationStatus"] | null;
  brokerage_name: string | null;
  brokerage_address: string | null;
  broker_manager_name: string | null;
  broker_manager_email: string | null;
  broker_manager_phone: string | null;
  brokerage_verification_status: AgentProfile["brokerageVerificationStatus"] | null;
  w9_file_url: string | null;
  w9_verification_status: AgentProfile["w9VerificationStatus"] | null;
  payout_provider_account_id: string | null;
  payout_setup_status: AgentProfile["payoutSetupStatus"] | null;
  payouts_enabled: boolean | null;
  agent_onboarding_completed: boolean | null;
  approval_status: AgentProfile["approvalStatus"] | null;
  service_areas: string[] | null;
  service_location: string | null;
  available_days: string[] | null;
  available_start_time: string | null;
  available_end_time: string | null;
  service_radius_miles: number | null;
  available_hours: string | null;
  required_notice_minutes: number | null;
  is_available: boolean | null;
  pending_earnings_cents: number | null;
  total_earnings_cents: number | null;
  completed_showings_count: number | null;
  acceptance_rate: number | null;
  average_response_seconds: number | null;
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
  buyer_profiles?: {
    identity_verification_status?: BuyerProfile["identityVerificationStatus"] | null;
    financial_verification_status?: BuyerProfile["financialVerificationStatus"] | null;
  } | null;
  properties?: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    price?: number | string | null;
    beds?: number | null;
    baths?: number | string | null;
    mls_number?: string | null;
    image_url?: string | null;
  } | null;
};

type AssignmentRow = {
  showing_request_id: string;
  agent_id: string;
};

type PayoutRow = {
  id: string;
  showing_request_id: string;
  agent_id: string;
  amount_cents: number;
  status: Payout["status"];
  created_at?: string | null;
  released_at?: string | null;
};

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type PaymentRow = {
  showing_request_id: string;
  amount_cents: number;
  status: string;
  created_at: string;
};

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

function mapAgent(row: AgentRow): AgentProfile {
  return {
    id: row.id,
    name: row.name ?? "Agent",
    email: row.users?.email ?? "",
    phone: row.phone ?? "",
    emailVerified: row.email_verified === true,
    licenseNumber: row.license_number ?? "",
    licenseState: row.license_state ?? row.licensed_state ?? "",
    licenseExpirationDate: row.license_expiration_date ?? "",
    licenseFileUrl: row.license_file_url ?? undefined,
    licenseVerificationStatus: row.license_verification_status ?? "pending_review",
    brokerageName: row.brokerage_name ?? "",
    brokerageAddress: row.brokerage_address ?? "",
    brokerManagerName: row.broker_manager_name ?? "",
    brokerManagerEmail: row.broker_manager_email ?? "",
    brokerManagerPhone: row.broker_manager_phone ?? "",
    brokerageVerificationStatus: row.brokerage_verification_status ?? "pending_review",
    w9FileUrl: row.w9_file_url ?? undefined,
    w9VerificationStatus: row.w9_verification_status ?? "pending_review",
    payoutProviderAccountId: row.payout_provider_account_id ?? undefined,
    payoutSetupStatus: row.payout_setup_status ?? "incomplete",
    payoutsEnabled: row.payouts_enabled === true,
    agentOnboardingCompleted: row.agent_onboarding_completed === true,
    approvalStatus: row.approval_status ?? "pending_review",
    serviceAreas: row.service_areas ?? [],
    serviceLocation: row.service_location ?? "",
    availableDays: row.available_days ?? [],
    availableStartTime: row.available_start_time?.slice(0, 5) ?? "",
    availableEndTime: row.available_end_time?.slice(0, 5) ?? "",
    serviceRadiusMiles: row.service_radius_miles ?? 10,
    availableHours: row.available_hours ?? "",
    requiredNoticeMinutes: row.required_notice_minutes ?? 60,
    isAvailable: row.is_available === true,
    pendingEarningsCents: row.pending_earnings_cents ?? 0,
    totalEarningsCents: row.total_earnings_cents ?? 0,
    completedShowingsCount: row.completed_showings_count ?? 0,
    acceptanceRate: Number(row.acceptance_rate ?? 0),
    averageResponseSeconds: row.average_response_seconds ?? 0,
  };
}

function propertyDetails(showing: ShowingRow) {
  if (!showing.properties) {
    return showing.property_summary ?? "Buyer-entered property details";
  }

  const pieces = [
    showing.properties.mls_number ? `MLS ${showing.properties.mls_number}` : null,
    showing.properties.price ? formatMoney(Number(showing.properties.price) * 100) : null,
    showing.properties.beds ? `${showing.properties.beds} beds` : null,
    showing.properties.baths ? `${showing.properties.baths} baths` : null,
  ].filter(Boolean);

  return pieces.join(" - ") || "Buyer-selected property";
}

function mapShowing(row: ShowingRow, assignment?: AssignmentRow): ShowingRequest {
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
}

async function loadDashboardData() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("sms_user_id")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (userId.startsWith("mock-")) {
    const agent = demoAgents[0];
    const nearby = isAgentReady(agent)
      ? demoShowings.filter(
          (showing) =>
            showing.status === "pending" &&
            matchingAgentsForZip(showing.zipCode).some((match) => match.id === agent.id),
        )
      : [];
    const assigned = demoShowings.filter((showing) => showing.assignedAgentId === agent.id);
    return {
      agent,
      nearby,
      assigned,
      payouts: demoPayouts.filter((payout) => payout.agentId === agent.id),
      payments: [],
      buyerStatuses: new Map(demoShowings.map((showing) => [showing.id, `${demoBuyer.identityVerificationStatus}/${demoBuyer.financialVerificationStatus}`])),
      propertyDetailsById: new Map(demoShowings.map((showing) => [showing.id, showing.propertySummary])),
      availabilityByDay: new Map(agent.availableDays.map((day) => [day, {
        startTime: agent.availableStartTime || "09:00",
        endTime: agent.availableEndTime || "17:00",
      }])),
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    redirect("/login?error=Supabase is not configured.");
  }

  const { data: agentRow } = await supabase
    .from("agent_profiles")
    .select("*, users(email)")
    .eq("user_id", userId)
    .maybeSingle<AgentRow>();

  if (!agentRow) {
    redirect("/agent/onboarding");
  }

  const nextPath = nextAgentOnboardingPath(agentRow);
  if (nextPath !== "/agent/dashboard") {
    redirect(nextPath);
  }

  const agent = mapAgent(agentRow);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const { data: rawAvailabilityRows } = await supabase
    .from("agent_availability")
    .select("day_of_week, start_time, end_time")
    .eq("agent_id", agent.id)
    .order("day_of_week", { ascending: true })
    .returns<AvailabilityRow[]>();
  const availabilityByDay = new Map(
    (rawAvailabilityRows ?? []).map((row) => [
      dayLabels[row.day_of_week] ?? "Mon",
      {
        startTime: row.start_time?.slice(0, 5) || "09:00",
        endTime: row.end_time?.slice(0, 5) || "17:00",
      },
    ]),
  );

  const { data: rawShowingRows } = await supabase
    .from("showing_requests")
    .select("*, buyer_profiles(identity_verification_status, financial_verification_status), properties(address, city, state, zip, price, beds, baths, mls_number, image_url)")
    .order("requested_at", { ascending: false })
    .returns<ShowingRow[]>();
  const allShowingRows = rawShowingRows ?? [];

  const showingIds = allShowingRows.map((showing) => showing.id);
  const { data: rawAssignments } = showingIds.length
    ? await supabase
        .from("showing_assignments")
        .select("showing_request_id, agent_id")
        .in("showing_request_id", showingIds)
        .returns<AssignmentRow[]>()
    : { data: [] as AssignmentRow[] };
  const assignments = rawAssignments ?? [];

  const assigned = allShowingRows
    .filter((showing) => assignments.some((assignment) => assignment.showing_request_id === showing.id && assignment.agent_id === agent.id))
    .map((showing) => mapShowing(showing, assignments.find((assignment) => assignment.showing_request_id === showing.id)));

  const nearby = isAgentReady(agent)
    ? allShowingRows
        .filter((showing) => {
          const alreadyAssigned = assignments.some((assignment) => assignment.showing_request_id === showing.id);
          const zipMatches = agent.serviceAreas.length === 0 || agent.serviceAreas.includes(showing.zip_code ?? "");
          const requestIsAvailable = showing.status === "pending" && ["held", "paid", "unpaid"].includes(showing.payment_status);
          return !alreadyAssigned && requestIsAvailable && zipMatches;
        })
        .map((showing) => mapShowing(showing))
    : [];

  const { data: rawPayoutRows } = await supabase
    .from("payouts")
    .select("id, showing_request_id, agent_id, amount_cents, status, created_at, released_at")
    .eq("agent_id", agent.id)
    .returns<PayoutRow[]>();
  const payoutRows = rawPayoutRows ?? [];

  const assignedShowingIds = assigned.map((showing) => showing.id);
  const { data: rawPayments } = assignedShowingIds.length
    ? await supabase
        .from("payments")
        .select("showing_request_id, amount_cents, status, created_at")
        .in("showing_request_id", assignedShowingIds)
        .returns<PaymentRow[]>()
    : { data: [] as PaymentRow[] };
  const payments = rawPayments ?? [];

  const buyerStatuses = new Map(
    allShowingRows.map((showing) => [
      showing.id,
      `${showing.buyer_profiles?.identity_verification_status ?? "unknown"}/${showing.buyer_profiles?.financial_verification_status ?? "unknown"}`,
    ]),
  );
  const propertyDetailsById = new Map(allShowingRows.map((showing) => [showing.id, propertyDetails(showing)]));

  return {
    agent,
    nearby,
    assigned,
    payouts: payoutRows.map((payout) => ({
      id: payout.id,
      showingRequestId: payout.showing_request_id,
      agentId: payout.agent_id,
      amountCents: payout.amount_cents,
      status: payout.status,
    })),
    payments,
    buyerStatuses,
    propertyDetailsById,
    availabilityByDay,
  };
}

export default async function AgentDashboardPage() {
  const { agent, nearby, assigned, payouts, payments, buyerStatuses, propertyDetailsById, availabilityByDay } = await loadDashboardData();
  const agentReady = isAgentReady(agent);
  const completed = assigned.filter((showing) => showing.status === "completed");
  const missingSteps = [
    !agent.emailVerified ? "Verify email" : null,
    agent.licenseVerificationStatus !== "approved" ? "License approval" : null,
    agent.brokerageVerificationStatus !== "approved" ? "Brokerage approval" : null,
    agent.w9VerificationStatus !== "approved" ? "W-9 approval" : null,
    agent.payoutSetupStatus !== "ready" || !agent.payoutsEnabled ? "Complete payout setup" : null,
    !agent.agentOnboardingCompleted ? "Complete onboarding" : null,
  ].filter(Boolean);

  return (
    <AppShell>
      <Section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-700">Agent dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold">{agent.name}</h1>
            <p className="mt-2 text-slate-600">
              License {agent.licenseNumber || "pending"} in {agent.licenseState || "pending"}. Availability:{" "}
              {agent.isAvailable ? "on" : "off"}. Radius: {agent.serviceRadiusMiles} miles.
            </p>
          </div>
          <StatusBadge status={agentReady ? "ready_to_accept" : "onboarding_blocked"} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <Card><p className="text-sm text-slate-500">Email</p><div className="mt-3"><StatusBadge status={agent.emailVerified ? "verified" : "not_verified"} /></div></Card>
          <Card><p className="text-sm text-slate-500">License</p><div className="mt-3"><StatusBadge status={agent.licenseVerificationStatus} /></div></Card>
          <Card><p className="text-sm text-slate-500">Brokerage</p><div className="mt-3"><StatusBadge status={agent.brokerageVerificationStatus} /></div></Card>
          <Card><p className="text-sm text-slate-500">W-9</p><div className="mt-3"><StatusBadge status={agent.w9VerificationStatus} /></div></Card>
          <Card><p className="text-sm text-slate-500">Payouts</p><div className="mt-3"><StatusBadge status={agent.payoutSetupStatus} /></div></Card>
        </div>

        {!agentReady && (
          <Card className="mt-4">
            <h2 className="font-semibold">Missing steps</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {missingSteps.map((step) => <li key={step}>{step}</li>)}
            </ul>
            <div className="mt-4">
              <ButtonLink href="/agent/onboarding" variant="secondary">Continue onboarding</ButtonLink>
            </div>
          </Card>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Card><p className="text-sm text-slate-500">Incoming requests</p><p className="mt-2 text-3xl font-semibold">{nearby.length}</p></Card>
          <Card><p className="text-sm text-slate-500">Completed showings</p><p className="mt-2 text-3xl font-semibold">{completed.length || agent.completedShowingsCount}</p></Card>
          <Card><p className="text-sm text-slate-500">Upcoming payouts</p><p className="mt-2 text-3xl font-semibold">{formatMoney(agent.pendingEarningsCents)}</p></Card>
          <Card><p className="text-sm text-slate-500">Total earnings</p><p className="mt-2 text-3xl font-semibold">{formatMoney(agent.totalEarningsCents)}</p></Card>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <h2 className="text-lg font-semibold">Availability settings</h2>
            <form action="/api/agent/availability" method="post" className="mt-4 grid gap-4">
              <input type="hidden" name="agentId" value={agent.id} />
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-slate-700">Available days and times</legend>
                <div className="grid gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[90px_1fr_1fr] sm:items-center">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          name="availableDays"
                          value={day}
                          defaultChecked={agent.availableDays.includes(day) || availabilityByDay.has(day)}
                        />
                        {day}
                      </label>
                      <Field
                        label="Start"
                        name={`startTime_${day}`}
                        type="time"
                        required={false}
                        defaultValue={availabilityByDay.get(day)?.startTime ?? agent.availableStartTime ?? "09:00"}
                      />
                      <Field
                        label="End"
                        name={`endTime_${day}`}
                        type="time"
                        required={false}
                        defaultValue={availabilityByDay.get(day)?.endTime ?? agent.availableEndTime ?? "17:00"}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
              <Field label="Service location" name="serviceLocation" placeholder="Miami, FL or 33131" defaultValue={agent.serviceLocation ?? ""} />
              <Field label="Service radius in miles" name="serviceRadiusMiles" type="number" defaultValue={agent.serviceRadiusMiles} />
              <label className="flex gap-3 text-sm text-slate-700">
                <input type="checkbox" name="isAvailable" value="true" defaultChecked={agent.isAvailable} className="mt-1" />
                Available to receive showing requests
              </label>
              <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                Save availability
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Incoming showing requests</h2>
            <div className="mt-4 grid gap-3">
              {!agentReady && (
                <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-600">
                  Complete and receive approval for all onboarding steps before viewing or accepting requests.
                </p>
              )}
              {agentReady && nearby.length === 0 && (
                <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-600">
                  No eligible requests are available right now.
                </p>
              )}
              {nearby.map((showing) => (
                <div key={showing.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{showing.propertyAddress ?? showing.mlsNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">{propertyDetailsById.get(showing.id) ?? showing.propertySummary}</p>
                    </div>
                    <StatusBadge status={showing.status} />
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-slate-600">
                    <p>{new Date(showing.preferredTime).toLocaleString()} - {showing.attendees} attendees</p>
                    <p>Buyer verification: {buyerStatuses.get(showing.id) ?? "unknown"}</p>
                    <p>Safety notes: {showing.safetyNotes}</p>
                    <p>Estimated payout: {formatMoney(showing.agentPayoutCents)}</p>
                    <p>Service radius: {agent.serviceRadiusMiles} miles from {agent.serviceLocation || "saved location"}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink href={`/agent/accept/${showing.id}?agent=${agent.id}`}>Accept request</ButtonLink>
                    <form action="/api/showings/decline" method="post">
                      <input type="hidden" name="showingId" value={showing.id} />
                      <input type="hidden" name="agentId" value={agent.id} />
                      <button className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100">
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold">Accepted upcoming showings</h2>
            <div className="mt-4 grid gap-3">
              {assigned.filter((showing) => showing.status !== "completed").length === 0 && (
                <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-600">No accepted upcoming showings.</p>
              )}
              {assigned.filter((showing) => showing.status !== "completed").map((showing) => (
                <div key={showing.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{showing.propertyAddress ?? showing.mlsNumber}</p>
                    <StatusBadge status={showing.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{showing.safetyNotes}</p>
                  <p className="mt-2 text-sm text-slate-600">{propertyDetailsById.get(showing.id) ?? showing.propertySummary}</p>
                  <form action="/api/showings/complete" method="post" className="mt-4">
                    <input type="hidden" name="showingId" value={showing.id} />
                    <input type="hidden" name="agentId" value={agent.id} />
                    <button className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-100">
                      Mark complete
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Earnings and payment history</h2>
            <div className="mt-4 grid gap-3">
              {completed.length === 0 && payouts.length === 0 && (
                <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-600">No completed payout history yet.</p>
              )}
              {payouts.map((payout) => {
                const showing = assigned.find((item) => item.id === payout.showingRequestId);
                return (
                  <div key={payout.id} className="rounded-md border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{showing?.propertyAddress ?? payout.showingRequestId}</p>
                        <p className="mt-1 text-sm text-slate-600">{formatMoney(payout.amountCents)}</p>
                      </div>
                      <StatusBadge status={payout.status} />
                    </div>
                  </div>
                );
              })}
              {payments.map((payment) => {
                const showing = assigned.find((item) => item.id === payment.showing_request_id);
                return (
                  <div key={`${payment.showing_request_id}-${payment.created_at}`} className="rounded-md border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{showing?.propertyAddress ?? payment.showing_request_id}</p>
                        <p className="mt-1 text-sm text-slate-600">{formatMoney(payment.amount_cents)} buyer payment</p>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
