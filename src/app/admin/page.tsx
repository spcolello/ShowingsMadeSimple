import Link from "next/link";
import { AppShell, Card, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoBuyer, demoPayouts, demoSafetyFlags, demoShowings, formatMoney } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase";

type AdminBuyer = {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  identityVerificationStatus: string;
  financialVerificationStatus: string;
  completed: boolean;
};

type AdminAgent = {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
  brokerageName: string;
  approvalStatus: string;
  completed: boolean;
};

type AdminShowing = {
  id: string;
  propertyAddress?: string;
  mlsNumber?: string;
  status: string;
  paymentStatus: string;
  showingFeeCents: number;
  agentPayoutCents: number;
};

type AdminPayment = {
  id: string;
  showingRequestId: string;
  amountCents: number;
  status: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  createdAt: string;
};

type AdminSafetyFlag = {
  id: string;
  severity: string;
  status: string;
  note: string;
};

function DeleteAccountForm({
  action,
  subjectId,
  label,
}: {
  action: "delete_buyer" | "delete_agent";
  subjectId: string;
  label: string;
}) {
  return (
    <form action="/api/admin/actions" method="post">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="note" value={`Admin deleted ${action === "delete_buyer" ? "buyer" : "agent"} test account`} />
      <button className="min-h-10 rounded-md border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
        {label}
      </button>
    </form>
  );
}

function AdminPostForm({
  action,
  subjectId,
  children,
  className,
}: {
  action: string;
  subjectId: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form action="/api/admin/actions" method="post" className={className}>
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="subjectId" value={subjectId} />
      {children}
    </form>
  );
}

async function loadAdminData() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      buyers: [{
        id: demoBuyer.id,
        fullName: demoBuyer.fullName,
        email: demoBuyer.email,
        emailVerified: demoBuyer.emailVerified,
        identityVerificationStatus: demoBuyer.identityVerificationStatus,
        financialVerificationStatus: demoBuyer.financialVerificationStatus,
        completed: demoBuyer.buyerOnboardingCompleted,
      }],
      agents: demoAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        licenseNumber: agent.licenseNumber,
        brokerageName: agent.brokerageName,
        approvalStatus: agent.approvalStatus,
        completed: agent.agentOnboardingCompleted,
      })),
      showings: demoShowings,
      documentCount: 5,
      payments: demoPayouts.map((payout) => ({
        id: payout.id,
        showingRequestId: payout.showingRequestId,
        amountCents: payout.amountCents,
        status: payout.status,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        createdAt: new Date().toISOString(),
      })),
      safetyFlags: demoSafetyFlags,
    };
  }

  const [buyersResult, agentsResult, showingsResult, documentsResult, paymentsResult, safetyResult] =
    await Promise.all([
      supabase.from("buyer_profiles").select("*, users(email)").order("created_at", { ascending: false }),
      supabase.from("agent_profiles").select("*, users(email)").order("created_at", { ascending: false }),
      supabase.from("showing_requests").select("*").order("requested_at", { ascending: false }),
      supabase.from("verification_documents").select("id, status").order("uploaded_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("safety_flags").select("*").order("created_at", { ascending: false }),
    ]);

  return {
    buyers: (buyersResult.data ?? []).map((buyer) => ({
      id: buyer.id,
      fullName: buyer.full_name ?? "Buyer",
      email: buyer.users?.email ?? buyer.user_id,
      emailVerified: buyer.email_verified ?? false,
      identityVerificationStatus: buyer.identity_verification_status ?? "pending_review",
      financialVerificationStatus: buyer.financial_verification_status ?? "pending_review",
      completed: buyer.buyer_onboarding_completed ?? false,
    })) satisfies AdminBuyer[],
    agents: (agentsResult.data ?? []).map((agent) => ({
      id: agent.id,
      name: agent.name ?? "Agent",
      email: agent.users?.email ?? agent.user_id,
      licenseNumber: agent.license_number ?? "Pending",
      brokerageName: agent.brokerage_name ?? "Pending brokerage",
      approvalStatus: agent.approval_status ?? "pending_review",
      completed: agent.agent_onboarding_completed ?? false,
    })) satisfies AdminAgent[],
    showings: (showingsResult.data ?? []).map((showing) => ({
      id: showing.id,
      propertyAddress: showing.property_address,
      mlsNumber: showing.mls_number,
      status: showing.status,
      paymentStatus: showing.payment_status,
      showingFeeCents: showing.showing_fee_cents ?? 0,
      agentPayoutCents: showing.agent_payout_cents ?? 0,
    })) satisfies AdminShowing[],
    documentCount: documentsResult.data?.length ?? 0,
    payments: (paymentsResult.data ?? []).map((payment) => ({
      id: payment.id,
      showingRequestId: payment.showing_request_id,
      amountCents: payment.amount_cents,
      status: payment.status,
      stripeCheckoutSessionId: payment.stripe_checkout_session_id,
      stripePaymentIntentId: payment.stripe_payment_intent_id,
      createdAt: payment.created_at,
    })) satisfies AdminPayment[],
    safetyFlags: (safetyResult.data ?? []).map((flag) => ({
      id: flag.id,
      severity: flag.severity,
      status: flag.status,
      note: flag.note,
    })) satisfies AdminSafetyFlag[],
  };
}

export default async function AdminPage() {
  const { buyers, agents, showings, documentCount, payments, safetyFlags } = await loadAdminData();
  const paymentByShowingId = new Map(payments.map((payment) => [payment.showingRequestId, payment]));
  const overview = [
    {
      id: "buyers",
      title: "Buyers",
      total: buyers.length,
      pending: buyers.filter((buyer) => !buyer.completed).length,
      href: "#buyers",
    },
    {
      id: "agents",
      title: "Agents",
      total: agents.length,
      pending: agents.filter((agent) => !agent.completed || agent.approvalStatus === "pending_review").length,
      href: "#agents",
    },
    {
      id: "showings",
      title: "Showings",
      total: showings.length,
      pending: showings.filter((showing) => showing.status === "pending").length,
      href: "#showings",
    },
    {
      id: "payments",
      title: "Payments",
      total: payments.length,
      pending: showings.filter((showing) => showing.paymentStatus === "held").length,
      href: "#payments",
    },
    {
      id: "safety",
      title: "Safety flags",
      total: safetyFlags.length,
      pending: safetyFlags.filter((flag) => flag.status === "open").length,
      href: "#safety",
    },
  ];

  return (
    <AppShell>
      <Section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-700">Admin dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold">Platform review queue</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review buyer and agent profiles, then approve or deny from the profile detail page.
            </p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-100">
              Log out
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {overview.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{item.title}</p>
                <Link href={item.href} className="text-sm font-semibold text-teal-700">View</Link>
              </div>
              <p className="mt-3 text-3xl font-semibold">{item.total}</p>
              <p className="mt-1 text-sm text-slate-600">{item.pending} pending</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card id="buyers">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Buyer profiles</h2>
              <span className="text-sm text-slate-500">{documentCount} documents</span>
            </div>
            <div className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200">
              {buyers.length === 0 && <p className="p-4 text-sm text-slate-600">No buyers yet.</p>}
              {buyers.map((buyer) => (
                <div key={buyer.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{buyer.fullName}</p>
                      <p className="text-sm text-slate-600">{buyer.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={buyer.completed ? "approved" : "pending_review"} />
                      <StatusBadge status={buyer.emailVerified ? "email_verified" : "email_pending"} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={`identity_${buyer.identityVerificationStatus}`} />
                    <StatusBadge status={`financial_${buyer.financialVerificationStatus}`} />
                    <Link
                      href={`/admin/buyers/${buyer.id}`}
                      className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      View profile
                    </Link>
                    <DeleteAccountForm action="delete_buyer" subjectId={buyer.id} label="Delete" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="agents">
            <h2 className="text-lg font-semibold">Agent profiles</h2>
            <div className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200">
              {agents.length === 0 && <p className="p-4 text-sm text-slate-600">No agents yet.</p>}
              {agents.map((agent) => (
                <div key={agent.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-slate-600">{agent.email}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {agent.licenseNumber} - {agent.brokerageName}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={agent.completed ? "approved" : agent.approvalStatus} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/agents/${agent.id}`}
                      className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      View profile
                    </Link>
                    <DeleteAccountForm action="delete_agent" subjectId={agent.id} label="Delete" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="showings">
            <h2 className="text-lg font-semibold">Showings</h2>
            <div className="mt-4 grid gap-3">
              {showings.length === 0 && <p className="text-sm text-slate-600">No showings yet.</p>}
              {showings.slice(0, 8).map((showing) => (
                <div key={showing.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{showing.propertyAddress ?? showing.mlsNumber}</p>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={showing.status} />
                      <StatusBadge status={showing.paymentStatus} />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Buyer fee {formatMoney(showing.showingFeeCents)} - Agent payout {formatMoney(showing.agentPayoutCents)}
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <AdminPostForm action="reassign_showing" subjectId={showing.id} className="flex gap-2">
                      <select
                        name="agentId"
                        required
                        className="min-h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm"
                      >
                        <option value="">Reassign agent</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                      <button className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-100">
                        Save
                      </button>
                    </AdminPostForm>
                    <AdminPostForm action="cancel_showing" subjectId={showing.id}>
                      <input type="hidden" name="note" value="Admin cancelled showing" />
                      <button className="min-h-10 w-full rounded-md border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                        Cancel showing
                      </button>
                    </AdminPostForm>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="payments">
            <h2 className="text-lg font-semibold">Payments</h2>
            <div className="mt-4 grid gap-3">
              {showings.length === 0 && <p className="text-sm text-slate-600">No payments yet.</p>}
              {showings.slice(0, 8).map((showing) => (
                <div key={showing.id} className="rounded-md border border-slate-200 p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{showing.propertyAddress ?? showing.id}</p>
                      <p className="mt-1 text-slate-600">
                        {formatMoney(paymentByShowingId.get(showing.id)?.amountCents ?? showing.showingFeeCents)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {paymentByShowingId.get(showing.id)?.stripePaymentIntentId ? "Stripe payment available" : "Internal/mock payment record"}
                      </p>
                    </div>
                    <StatusBadge status={paymentByShowingId.get(showing.id)?.status ?? showing.paymentStatus} />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <AdminPostForm action="set_payment_status" subjectId={showing.id} className="flex gap-2">
                      <select
                        name="paymentStatus"
                        defaultValue={paymentByShowingId.get(showing.id)?.status ?? showing.paymentStatus}
                        className="min-h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm"
                      >
                        {["unpaid", "paid", "held", "released", "refunded", "failed"].map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                      <button className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-100">
                        Update
                      </button>
                    </AdminPostForm>
                    <AdminPostForm action="refund_payment" subjectId={showing.id}>
                      <input type="hidden" name="note" value="Admin issued refund" />
                      <button className="min-h-10 w-full rounded-md border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                        Refund
                      </button>
                    </AdminPostForm>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="safety" className="lg:col-span-2">
            <h2 className="text-lg font-semibold">Safety flags</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {safetyFlags.length === 0 && <p className="text-sm text-slate-600">No safety flags.</p>}
              {safetyFlags.map((flag) => (
                <div key={flag.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={flag.severity} />
                    <StatusBadge status={flag.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{flag.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
