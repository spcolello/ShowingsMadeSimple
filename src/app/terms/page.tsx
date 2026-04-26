import { AppShell, Card, Section } from "@/components/ui";

export default function TermsPage() {
  return (
    <AppShell>
      <Section className="max-w-3xl">
        <h1 className="text-3xl font-semibold">Terms and compliance</h1>
        <Card className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
          <p>
            Showings Made Simple facilitates scheduling, buyer payment collection, agent matching,
            SMS notifications, and compliance recordkeeping for property showings.
          </p>
          <p>
            The platform does not replace brokerage supervision, agency disclosure duties, MLS
            rules, fair housing compliance, state licensing requirements, property access rules, or
            legal obligations owed by buyers, sellers, agents, and brokers.
          </p>
          <p>
            MVP verification uses document upload placeholders and manual admin approval. Agent
            payouts are tracked as pending earnings until Stripe Connect payout automation is added.
          </p>
        </Card>
      </Section>
    </AppShell>
  );
}
