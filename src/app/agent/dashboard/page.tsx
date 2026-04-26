import { AppShell, ButtonLink, Card, Field, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoBuyer, demoPayouts, demoShowings, formatMoney, matchingAgentsForZip } from "@/lib/demo-data";
import { isAgentReady } from "@/lib/mvp-rules";

export default function AgentDashboardPage() {
  const agent = demoAgents[0];
  const agentReady = isAgentReady(agent);
  const nearby = agentReady
    ? demoShowings.filter(
        (showing) =>
          showing.status === "pending" &&
          matchingAgentsForZip(showing.zipCode).some((match) => match.id === agent.id),
      )
    : [];
  const assigned = demoShowings.filter((showing) => showing.assignedAgentId === agent.id);
  const completed = assigned.filter((showing) => showing.status === "completed");
  const payoutHistory = demoPayouts.filter((payout) => payout.agentId === agent.id);
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
              License {agent.licenseNumber} in {agent.licenseState}. Availability:{" "}
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
          <Card><p className="text-sm text-slate-500">Completed showings</p><p className="mt-2 text-3xl font-semibold">{agent.completedShowingsCount}</p></Card>
          <Card><p className="text-sm text-slate-500">Upcoming payouts</p><p className="mt-2 text-3xl font-semibold">{formatMoney(agent.pendingEarningsCents)}</p></Card>
          <Card><p className="text-sm text-slate-500">Total earnings</p><p className="mt-2 text-3xl font-semibold">{formatMoney(agent.totalEarningsCents)}</p></Card>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <h2 className="text-lg font-semibold">Availability settings</h2>
            <form action="/api/agent/availability" method="post" className="mt-4 grid gap-4">
              <input type="hidden" name="agentId" value={agent.id} />
              <Field label="Available days" name="availableDays" placeholder={agent.availableDays.join(", ")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start time" name="availableStartTime" type="time" />
                <Field label="End time" name="availableEndTime" type="time" />
              </div>
              <Field label="Service radius in miles" name="serviceRadiusMiles" type="number" placeholder={String(agent.serviceRadiusMiles)} />
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
                      <p className="font-semibold">{showing.propertyAddress}</p>
                      <p className="mt-1 text-sm text-slate-600">{showing.propertySummary}</p>
                    </div>
                    <StatusBadge status={showing.status} />
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-slate-600">
                    <p>{new Date(showing.preferredTime).toLocaleString()} - {showing.attendees} attendees</p>
                    <p>Buyer: {demoBuyer.identityVerificationStatus}/{demoBuyer.financialVerificationStatus}</p>
                    <p>Safety notes: {showing.safetyNotes}</p>
                    <p>Estimated payout: {formatMoney(showing.agentPayoutCents)}</p>
                    <p>Distance: not available until geocoding is configured</p>
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
                    <p className="font-semibold">{showing.propertyAddress}</p>
                    <StatusBadge status={showing.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{showing.safetyNotes}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Earnings and payment history</h2>
            <div className="mt-4 grid gap-3">
              {completed.length === 0 && payoutHistory.length === 0 && (
                <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-600">No completed payout history yet.</p>
              )}
              {payoutHistory.map((payout) => {
                const showing = demoShowings.find((item) => item.id === payout.showingRequestId);
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
            </div>
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
