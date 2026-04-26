import { AppShell, ButtonLink, Card, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoShowings, formatMoney, matchingAgentsForZip } from "@/lib/demo-data";

export default async function ShowingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const showing = demoShowings.find((item) => item.id === id) ?? demoShowings[0];
  const agent = demoAgents.find((item) => item.id === showing.assignedAgentId);
  const matches = matchingAgentsForZip(showing.zipCode);

  return (
    <AppShell>
      <Section className="max-w-4xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-teal-700">Showing detail</p>
            <h1 className="mt-1 text-3xl font-semibold">{showing.propertyAddress}</h1>
          </div>
          <StatusBadge status={showing.status} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Request</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Preferred time</dt>
                <dd>{new Date(showing.preferredTime).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Attendees</dt>
                <dd>{showing.attendees}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Notes</dt>
                <dd>{showing.notes}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h2 className="font-semibold">Payment and assignment</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Payment</dt>
                <dd>
                  {showing.paymentStatus} - {formatMoney(showing.showingFeeCents)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Assigned agent</dt>
                <dd>{agent?.name ?? "Waiting for first accept"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Agents notified</dt>
                <dd>{matches.map((match) => match.name).join(", ") || "None yet"}</dd>
              </div>
            </dl>
          </Card>
        </div>
        <div className="mt-6">
          <ButtonLink href="/buyer/dashboard" variant="secondary">
            Back to dashboard
          </ButtonLink>
        </div>
      </Section>
    </AppShell>
  );
}
