import { Landmark } from "lucide-react";
import { AgentOnboardingSteps } from "@/components/onboarding";
import { AppShell, Card, Field, Section } from "@/components/ui";

export default function AgentPayoutStepPage() {
  return (
    <AppShell>
      <Section className="max-w-2xl">
        <AgentOnboardingSteps current="payout" />
        <Card>
          <Landmark className="text-teal-700" />
          <h1 className="mt-4 text-2xl font-semibold">Payout setup</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use Stripe Connect in production. This MVP stores only a safe provider account ID and payout status.
          </p>
          <form action="/api/agent/payout" method="post" className="mt-6 grid gap-4">
            <Field label="Stripe Connect account ID placeholder" name="payoutProviderAccountId" placeholder="acct_..." />
            <label className="flex gap-3 text-sm text-slate-700">
              <input type="checkbox" name="payoutsEnabled" value="true" className="mt-1" />
              Stripe Connect onboarding is complete and payouts are enabled.
            </label>
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Save payout setup
            </button>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
