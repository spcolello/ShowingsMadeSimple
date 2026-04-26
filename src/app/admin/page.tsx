import Link from "next/link";
import { AppShell, Card, Section, StatusBadge } from "@/components/ui";
import {
  demoAgents,
  demoBuyer,
  demoComplianceLogs,
  demoDocuments,
  demoPayouts,
  demoSafetyFlags,
  demoShowings,
  formatMoney,
} from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase";

type AdminBuyer = {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  identityVerificationStatus: string;
  financialVerificationStatus: string;
};

type AdminAgent = {
  id: string;
  name: string;
  licenseNumber: string;
  brokerageName: string;
  approvalStatus: string;
};

type AdminShowing = {
  id: string;
  propertyAddress?: string;
  mlsNumber?: string;
  status: string;
  paymentStatus: string;
  showingFeeCents: number;
  assignedAgentId?: string;
};

type AdminDocument = {
  id: string;
  ownerId: string;
  type: string;
  status: string;
};

type AdminSafetyFlag = {
  id: string;
  severity: string;
  status: string;
  note: string;
};

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
      }],
      agents: demoAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        licenseNumber: agent.licenseNumber,
        brokerageName: agent.brokerageName,
        approvalStatus: agent.approvalStatus,
      })),
      showings: demoShowings,
      documents: demoDocuments,
      payouts: demoPayouts,
      safetyFlags: demoSafetyFlags,
      auditLogs: demoComplianceLogs,
    };
  }

  const [buyersResult, agentsResult, showingsResult, documentsResult, paymentsResult, safetyResult, auditResult] =
    await Promise.all([
      supabase.from("buyer_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("agent_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("showing_requests").select("*").order("requested_at", { ascending: false }),
      supabase.from("verification_documents").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("safety_flags").select("*").order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

  return {
    buyers: (buyersResult.data ?? []).map((buyer) => ({
      id: buyer.id,
      fullName: buyer.full_name ?? "Buyer",
      email: buyer.email ?? buyer.user_id,
      emailVerified: buyer.email_verified ?? false,
      identityVerificationStatus: buyer.identity_verification_status ?? "pending_review",
      financialVerificationStatus: buyer.financial_verification_status ?? "pending_review",
    })) satisfies AdminBuyer[],
    agents: (agentsResult.data ?? []).map((agent) => ({
      id: agent.id,
      name: agent.name ?? "Agent",
      licenseNumber: agent.license_number ?? "Pending",
      brokerageName: agent.brokerage_name ?? "Pending brokerage",
      approvalStatus: agent.approval_status ?? "pending_review",
    })) satisfies AdminAgent[],
    showings: (showingsResult.data ?? []).map((showing) => ({
      id: showing.id,
      propertyAddress: showing.property_address,
      mlsNumber: showing.mls_number,
      status: showing.status,
      paymentStatus: showing.payment_status,
      showingFeeCents: showing.showing_fee_cents ?? 0,
      assignedAgentId: undefined,
    })) satisfies AdminShowing[],
    documents: (documentsResult.data ?? []).map((document) => ({
      id: document.id,
      ownerId: document.owner_user_id,
      type: document.document_type,
      status: document.status ?? document.review_status ?? "pending_review",
    })) satisfies AdminDocument[],
    payouts: paymentsResult.data ?? [],
    safetyFlags: (safetyResult.data ?? []).map((flag) => ({
      id: flag.id,
      severity: flag.severity,
      status: flag.status,
      note: flag.note,
    })) satisfies AdminSafetyFlag[],
    auditLogs: auditResult.data ?? [],
  };
}

function AdminActionForm({
  action,
  subjectId,
  label,
  agentId,
  children,
}: {
  action: string;
  subjectId: string;
  label: string;
  agentId?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action="/api/admin/actions" method="post" className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="subjectId" value={subjectId} />
      {agentId && <input type="hidden" name="agentId" value={agentId} />}
      {children}
      <input
        name="note"
        placeholder="Internal note"
        className="min-h-10 rounded-md border border-slate-300 px-2 text-sm"
      />
      <button className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-100">
        {label}
      </button>
    </form>
  );
}

export default async function AdminPage() {
  const { buyers, agents, showings, documents, payouts, safetyFlags, auditLogs } = await loadAdminData();
  const primaryBuyer = buyers[0];
  const overview = [
    {
      id: "buyers",
      title: "Buyers",
      total: buyers.length,
      pending: buyers.filter((buyer) => buyer.identityVerificationStatus === "pending_review" || buyer.financialVerificationStatus === "pending_review").length,
      recent: "Buyer verification queue",
    },
    {
      id: "agents",
      title: "Agents",
      total: agents.length,
      pending: agents.filter((agent) => agent.approvalStatus === "pending_review").length,
      recent: "Agent onboarding queue",
    },
    {
      id: "showings",
      title: "Showings",
      total: showings.length,
      pending: showings.filter((showing) => showing.status === "pending").length,
      recent: "Showing request operations",
    },
    {
      id: "payments",
      title: "Payments",
      total: showings.filter((showing) => showing.paymentStatus !== "unpaid").length,
      pending: showings.filter((showing) => showing.paymentStatus === "held").length,
      recent: `${payouts.length} payment records`,
    },
    {
      id: "safety",
      title: "Safety flags",
      total: safetyFlags.length,
      pending: safetyFlags.filter((flag) => flag.status === "open").length,
      recent: safetyFlags[0]?.note ?? "No recent flags",
    },
  ];

  return (
    <AppShell>
      <Section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-700">Admin dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold">Platform operations</h1>
            <p className="mt-2 text-sm text-slate-600">
              Development access uses the mock admin login only. Do not use hardcoded credentials in production.
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
                <Link href={`#${item.id}`} className="text-sm font-semibold text-teal-700">Manage</Link>
              </div>
              <p className="mt-3 text-3xl font-semibold">{item.total}</p>
              <p className="mt-1 text-sm text-slate-600">{item.pending} pending</p>
              <p className="mt-3 text-xs leading-5 text-slate-500">{item.recent}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2" id="buyers">
            <h2 className="text-lg font-semibold">Buyers</h2>
            <div className="mt-4 rounded-md border border-slate-200 p-4">
              {buyers.map((buyer) => (
                <div key={buyer.id} className="border-b border-slate-200 py-3 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{buyer.fullName}</p>
                      <p className="text-sm text-slate-600">{buyer.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={buyer.emailVerified ? "email_verified" : "email_pending"} />
                      <StatusBadge status={buyer.identityVerificationStatus} />
                      <StatusBadge status={buyer.financialVerificationStatus} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminActionForm action="approve_buyer_identity" subjectId={buyer.id} label="Approve ID" />
                    <AdminActionForm action="reject_buyer_identity" subjectId={buyer.id} label="Reject ID" />
                    <AdminActionForm action="approve_buyer_financial" subjectId={buyer.id} label="Approve financial" />
                    <AdminActionForm action="suspend_buyer" subjectId={buyer.id} label="Suspend buyer" />
                  </div>
                </div>
              ))}
              {!primaryBuyer && <p className="text-sm text-slate-600">No buyers yet.</p>}
            </div>
          </Card>

          <Card id="agents">
            <h2 className="text-lg font-semibold">Agents</h2>
            <div className="mt-4 grid gap-3">
              {agents.map((agent) => (
                <div key={agent.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-slate-600">{agent.licenseNumber} - {agent.brokerageName}</p>
                    </div>
                    <StatusBadge status={agent.approvalStatus} />
                  </div>
                  <div className="mt-4 grid gap-2">
                    <div className="flex flex-wrap gap-2">
                      <AdminActionForm action="approve_agent" subjectId={agent.id} label="Approve" />
                      <AdminActionForm action="reject_agent" subjectId={agent.id} label="Reject" />
                      <AdminActionForm action="suspend_agent" subjectId={agent.id} label="Suspend" />
                    </div>
                    <AdminActionForm action="override_agent_availability" subjectId={agent.id} label="Override availability">
                      <select name="isAvailable" className="min-h-10 rounded-md border border-slate-300 px-2 text-sm">
                        <option value="true">Available on</option>
                        <option value="false">Available off</option>
                      </select>
                      <input name="serviceRadiusMiles" placeholder="Radius" className="min-h-10 w-20 rounded-md border border-slate-300 px-2 text-sm" />
                      <input name="availableHours" placeholder="Hours" className="min-h-10 rounded-md border border-slate-300 px-2 text-sm" />
                    </AdminActionForm>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="showings">
            <h2 className="text-lg font-semibold">Showings</h2>
            <div className="mt-4 grid gap-3">
              {showings.map((showing) => (
                <div key={showing.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{showing.propertyAddress ?? showing.mlsNumber}</p>
                    <StatusBadge status={showing.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{showing.paymentStatus} - {formatMoney(showing.showingFeeCents)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminActionForm action="reassign_showing" subjectId={showing.id} agentId={agents[0]?.id} label="Reassign" />
                    <AdminActionForm action="refund_payment" subjectId={showing.id} label="Refund" />
                    <AdminActionForm action="mark_showing_complete" subjectId={showing.id} agentId={showing.assignedAgentId ?? agents[0]?.id} label="Mark complete" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="payments">
            <h2 className="text-lg font-semibold">Payments</h2>
            <div className="mt-4 grid gap-3">
              {showings.map((showing) => (
                <div key={showing.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
                  <span>{showing.propertyAddress ?? showing.id}</span>
                  <span>{formatMoney(showing.showingFeeCents)} - {showing.paymentStatus}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card id="safety">
            <h2 className="text-lg font-semibold">Safety flags</h2>
            <div className="mt-4 grid gap-3">
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

          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold">Compliance document review</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {documents.map((document) => (
                <div key={document.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{document.type.replaceAll("_", " ")}</p>
                      <p className="text-sm text-slate-600">Owner: {document.ownerId}</p>
                      <a href="#" className="text-sm font-semibold text-teal-700">View uploaded document</a>
                    </div>
                    <StatusBadge status={document.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminActionForm action="approve_document" subjectId={document.id} label="Approve" />
                    <AdminActionForm action="reject_document" subjectId={document.id} label="Reject" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold">Recent audit activity</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr><th className="py-2">When</th><th>Actor</th><th>Action</th><th>Subject</th></tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-200">
                      <td className="py-3">{new Date(log.created_at ?? log.createdAt).toLocaleString()}</td>
                      <td>{log.actor ?? log.admin_user_id ?? "admin"}</td>
                      <td>{log.action}</td>
                      <td>{log.subject ?? log.subject_id ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
