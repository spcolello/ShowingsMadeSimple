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

export default function AdminPage() {
  return (
    <AppShell>
      <Section>
        <p className="text-sm font-semibold text-teal-700">Admin dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold">Operations review</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-6">
          <Card><p className="text-sm text-slate-500">Buyers</p><p className="mt-2 text-3xl font-semibold">1</p></Card>
          <Card><p className="text-sm text-slate-500">Agents</p><p className="mt-2 text-3xl font-semibold">{demoAgents.length}</p></Card>
          <Card><p className="text-sm text-slate-500">Showings</p><p className="mt-2 text-3xl font-semibold">{demoShowings.length}</p></Card>
          <Card><p className="text-sm text-slate-500">Payments held</p><p className="mt-2 text-3xl font-semibold">{formatMoney(15000)}</p></Card>
          <Card><p className="text-sm text-slate-500">Safety flags</p><p className="mt-2 text-3xl font-semibold">{demoSafetyFlags.length}</p></Card>
          <Card><p className="text-sm text-slate-500">Queue</p><p className="mt-2 text-3xl font-semibold">2</p></Card>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Buyer verification queue</h2>
            <div className="mt-4 rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{demoBuyer.fullName}</p>
                  <p className="text-sm text-slate-600">{demoBuyer.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={demoBuyer.identityVerificationStatus} />
                  <StatusBadge status={demoBuyer.financialVerificationStatus} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Approve identity", "Reject identity", "Approve financial", "Suspend buyer"].map((action) => (
                  <button key={action} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Agent approval queue</h2>
            <div className="mt-4 grid gap-3">
              {demoAgents.map((agent) => (
                <div key={agent.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-slate-600">
                        {agent.licenseNumber} - {agent.brokerageName}
                      </p>
                    </div>
                    <StatusBadge status={agent.approvalStatus} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Approve", "Reject", "Suspend", "Override availability"].map((action) => (
                      <button key={action} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Showing controls</h2>
            <div className="mt-4 grid gap-3">
              {demoShowings.map((showing) => (
                <div key={showing.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{showing.propertyAddress ?? showing.mlsNumber}</p>
                    <StatusBadge status={showing.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Reassign", "Refund", "Mark complete"].map((action) => (
                      <button key={action} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Documents and payouts</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {demoDocuments.map((document) => (
                <div key={document.id} className="flex justify-between rounded-md border border-slate-200 p-3">
                  <span>{document.type}</span>
                  <StatusBadge status={document.status} />
                </div>
              ))}
              {demoPayouts.map((payout) => (
                <div key={payout.id} className="flex justify-between rounded-md border border-slate-200 p-3">
                  <span>{formatMoney(payout.amountCents)}</span>
                  <StatusBadge status={payout.status} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="font-semibold">Audit logs</h2>
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
