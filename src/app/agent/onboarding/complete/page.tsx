import { Clock } from "lucide-react";
import { AgentOnboardingSteps } from "@/components/onboarding";
import { AppShell, Card, Section, StatusBadge } from "@/components/ui";

export default function AgentOnboardingCompletePage() {
  return (
    <AppShell>
      <Section className="max-w-2xl">
        <AgentOnboardingSteps current="complete" />
        <Card>
          <Clock className="text-teal-700" />
          <h1 className="mt-4 text-2xl font-semibold">Agent account under review</h1>
          <p className="mt-2 text-sm text-slate-600">
            You can accept showing requests after email, license, brokerage, W-9, and payout setup are approved.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge status="email_verified" />
            <StatusBadge status="license_pending_review" />
            <StatusBadge status="brokerage_pending_review" />
            <StatusBadge status="w9_pending_review" />
            <StatusBadge status="payout_pending" />
          </div>
          <p className="mt-6 text-sm text-slate-600">
            The dashboard unlocks after an admin approves your license, brokerage, W-9, and payout setup.
          </p>
        </Card>
      </Section>
    </AppShell>
  );
}
