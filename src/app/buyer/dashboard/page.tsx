import Link from "next/link";
import { AppShell, ButtonLink, Card, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoBuyer, demoShowings, formatMoney } from "@/lib/demo-data";

export default function BuyerDashboardPage() {
  return (
    <AppShell>
      <Section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-700">Buyer dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold">{demoBuyer.fullName}</h1>
            <p className="mt-2 text-slate-600">Verification: {demoBuyer.verificationStatus}</p>
          </div>
          <ButtonLink href="/buyer/showings/new">Request showing</ButtonLink>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">Pending requests</p>
            <p className="mt-2 text-3xl font-semibold">
              {demoShowings.filter((showing) => showing.status !== "completed").length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Past showings</p>
            <p className="mt-2 text-3xl font-semibold">
              {demoShowings.filter((showing) => showing.status === "completed").length}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Payment status</p>
            <p className="mt-2 text-3xl font-semibold">Current</p>
          </Card>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-1 gap-0 divide-y divide-slate-200">
            {demoShowings.map((showing) => {
              const agent = demoAgents.find((item) => item.id === showing.assignedAgentId);
              return (
                <Link
                  key={showing.id}
                  href={`/buyer/showings/${showing.id}`}
                  className="grid gap-3 p-4 hover:bg-slate-50 md:grid-cols-[1.3fr_0.7fr_0.7fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-semibold">{showing.propertyAddress}</p>
                    <p className="text-sm text-slate-600">{showing.zipCode}</p>
                  </div>
                  <p className="text-sm text-slate-700">
                    {new Date(showing.preferredTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-700">
                    {agent ? `Agent: ${agent.name}` : "Awaiting agent"}
                  </p>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={showing.status} />
                    <span className="text-sm text-slate-500">{formatMoney(showing.showingFeeCents)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Section>
    </AppShell>
  );
}
