import { AppShell, Card, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoBuyer, demoComplianceLogs, demoShowings, formatMoney } from "@/lib/demo-data";

export default function AdminPage() {
  return (
    <AppShell>
      <Section>
        <p className="text-sm font-semibold text-teal-700">Admin dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold">Operations review</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Card><p className="text-sm text-slate-500">Buyers</p><p className="mt-2 text-3xl font-semibold">1</p></Card>
          <Card><p className="text-sm text-slate-500">Agents</p><p className="mt-2 text-3xl font-semibold">{demoAgents.length}</p></Card>
          <Card><p className="text-sm text-slate-500">Requests</p><p className="mt-2 text-3xl font-semibold">{demoShowings.length}</p></Card>
          <Card><p className="text-sm text-slate-500">Payments</p><p className="mt-2 text-3xl font-semibold">{formatMoney(22500)}</p></Card>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Buyer verification</h2>
            <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 p-3">
              <div><p className="font-medium">{demoBuyer.fullName}</p><p className="text-sm text-slate-600">{demoBuyer.email}</p></div>
              <StatusBadge status={demoBuyer.verificationStatus} />
            </div>
          </Card>
          <Card>
            <h2 className="font-semibold">Agent license review</h2>
            <div className="mt-4 grid gap-3">
              {demoAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                  <div><p className="font-medium">{agent.name}</p><p className="text-sm text-slate-600">{agent.licenseNumber}</p></div>
                  <StatusBadge status={agent.verified ? "approved" : "manual_review"} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <h2 className="font-semibold">Compliance records</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500"><tr><th className="py-2">When</th><th>Actor</th><th>Action</th><th>Subject</th></tr></thead>
                <tbody>
                  {demoComplianceLogs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-200">
                      <td className="py-3">{new Date(log.createdAt).toLocaleString()}</td><td>{log.actor}</td><td>{log.action}</td><td>{log.subject}</td>
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
