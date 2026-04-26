import { AppShell, ButtonLink, Card, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoShowings, formatMoney, matchingAgentsForZip } from "@/lib/demo-data";

export default function AgentDashboardPage() {
  const agent = demoAgents[0];
  const nearby = demoShowings.filter(
    (showing) => showing.status === "pending" && matchingAgentsForZip(showing.zipCode).some((match) => match.id === agent.id),
  );
  const assigned = demoShowings.filter((showing) => showing.assignedAgentId === agent.id);

  return (
    <AppShell>
      <Section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-700">Agent dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold">{agent.name}</h1>
            <p className="mt-2 text-slate-600">
              License {agent.licenseNumber} in {agent.licensedState}. Availability:{" "}
              {agent.available ? "on" : "off"}. Radius: {agent.serviceRadiusMiles} miles.
            </p>
          </div>
          <StatusBadge status={agent.approvalStatus} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Card>
            <p className="text-sm text-slate-500">Nearby open requests</p>
            <p className="mt-2 text-3xl font-semibold">{nearby.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Assigned showings</p>
            <p className="mt-2 text-3xl font-semibold">{assigned.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Estimated pending earnings</p>
            <p className="mt-2 text-3xl font-semibold">{formatMoney(agent.pendingEarningsCents)}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Acceptance rate</p>
            <p className="mt-2 text-3xl font-semibold">{Math.round(agent.acceptanceRate * 100)}%</p>
          </Card>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold">Available requests nearby</h2>
            <div className="mt-4 grid gap-3">
              {nearby.length === 0 && (
                <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-600">
                  No eligible requests are available right now.
                </p>
              )}
              {nearby.map((showing) => (
                <div key={showing.id} className="rounded-md border border-slate-200 p-4">
                  <p className="font-semibold">{showing.propertyAddress}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Date(showing.preferredTime).toLocaleString()} - {showing.attendees} attendees
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Buyer verified. Payout {formatMoney(showing.agentPayoutCents)}.{" "}
                    {showing.safetyNotes}
                  </p>
                  <div className="mt-4">
                    <ButtonLink href={`/agent/accept/${showing.id}?agent=${agent.id}`}>
                      Accept first
                    </ButtonLink>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Assigned and completed</h2>
            <div className="mt-4 grid gap-3">
              {assigned.length === 0 && (
                <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-600">
                  No accepted showings yet.
                </p>
              )}
              {assigned.map((showing) => (
                <div key={showing.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{showing.propertyAddress}</p>
                    <StatusBadge status={showing.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{showing.safetyNotes}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
