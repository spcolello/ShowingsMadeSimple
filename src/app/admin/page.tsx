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

const overview = [
  {
    id: "buyers",
    title: "Buyers",
    total: 1,
    pending: demoBuyer.identityVerificationStatus === "pending_review" || demoBuyer.financialVerificationStatus === "pending_review" ? 1 : 0,
    recent: "Buyer verification updated",
  },
  {
    id: "agents",
    title: "Agents",
    total: demoAgents.length,
    pending: demoAgents.filter((agent) => agent.approvalStatus === "pending_review").length,
    recent: "Agent onboarding queue reviewed",
  },
  {
    id: "showings",
    title: "Showings",
    total: demoShowings.length,
    pending: demoShowings.filter((showing) => showing.status === "pending").length,
    recent: "Payment held and agent broadcast queued",
  },
  {
    id: "payments",
    title: "Payments",
    total: demoShowings.filter((showing) => showing.paymentStatus !== "unpaid").length,
    pending: demoShowings.filter((showing) => showing.paymentStatus === "held").length,
    recent: `${formatMoney(demoPayouts.reduce((sum, payout) => sum + payout.amountCents, 0))} payout activity`,
  },
  {
    id: "safety",
    title: "Safety flags",
    total: demoSafetyFlags.length,
    pending: demoSafetyFlags.filter((flag) => flag.status === "open").length,
    recent: demoSafetyFlags[0]?.note ?? "No recent flags",
  },
];

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

export default function AdminPage() {
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{demoBuyer.fullName}</p>
                  <p className="text-sm text-slate-600">{demoBuyer.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={demoBuyer.emailVerified ? "email_verified" : "email_pending"} />
                  <StatusBadge status={demoBuyer.identityVerificationStatus} />
                  <StatusBadge status={demoBuyer.financialVerificationStatus} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <AdminActionForm action="approve_buyer_identity" subjectId={demoBuyer.id} label="Approve ID" />
                <AdminActionForm action="reject_buyer_identity" subjectId={demoBuyer.id} label="Reject ID" />
                <AdminActionForm action="approve_buyer_financial" subjectId={demoBuyer.id} label="Approve financial" />
                <AdminActionForm action="suspend_buyer" subjectId={demoBuyer.id} label="Suspend buyer" />
              </div>
            </div>
          </Card>

          <Card id="agents">
            <h2 className="text-lg font-semibold">Agents</h2>
            <div className="mt-4 grid gap-3">
              {demoAgents.map((agent) => (
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
              {demoShowings.map((showing) => (
                <div key={showing.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">{showing.propertyAddress ?? showing.mlsNumber}</p>
                    <StatusBadge status={showing.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{showing.paymentStatus} - {formatMoney(showing.showingFeeCents)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminActionForm action="reassign_showing" subjectId={showing.id} agentId={demoAgents[0].id} label="Reassign to Sam" />
                    <AdminActionForm action="refund_payment" subjectId={showing.id} label="Refund" />
                    <AdminActionForm action="mark_showing_complete" subjectId={showing.id} agentId={showing.assignedAgentId ?? demoAgents[0].id} label="Mark complete" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="payments">
            <h2 className="text-lg font-semibold">Payments</h2>
            <div className="mt-4 grid gap-3">
              {demoShowings.map((showing) => (
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
              {demoSafetyFlags.map((flag) => (
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
              {demoDocuments.map((document) => (
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
                  {demoComplianceLogs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-200">
                      <td className="py-3">{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.actor}</td>
                      <td>{log.action}</td>
                      <td>{log.subject}</td>
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
