import { AppShell, Card, Section, StatusBadge } from "@/components/ui";
import { demoShowings, matchingAgentsForZip } from "@/lib/demo-data";

export default function AcceptShowingPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; claimed?: string }>;
}) {
  return (
    <AcceptContent searchParams={searchParams} />
  );
}

async function AcceptContent({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; claimed?: string }>;
}) {
  const params = await searchParams;
  const showing = demoShowings[0];
  const agentId = params.agent ?? "agent-sam";
  const alreadyClaimed = params.claimed === "true";
  const match = matchingAgentsForZip(showing.zipCode).find((agent) => agent.id === agentId);

  return (
    <AppShell>
      <Section className="max-w-2xl">
        <Card>
          <StatusBadge status={alreadyClaimed ? "already_claimed" : "available"} />
          <h1 className="mt-4 text-2xl font-semibold">
            {alreadyClaimed ? "This showing has already been claimed." : "Accept this showing?"}
          </h1>
          <p className="mt-3 text-slate-600">
            {showing.propertyAddress} at {new Date(showing.preferredTime).toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Secure accept link for {match?.name ?? "verified agent"}. The API enforces first-come-first-serve assignment.
          </p>
          {!alreadyClaimed && (
            <form action="/api/showings/accept" method="post" className="mt-6">
              <input type="hidden" name="showingId" value={showing.id} />
              <input type="hidden" name="agentId" value={agentId} />
              <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                Accept showing
              </button>
            </form>
          )}
        </Card>
      </Section>
    </AppShell>
  );
}
