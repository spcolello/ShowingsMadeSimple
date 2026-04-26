import { Clock } from "lucide-react";
import { AppShell, ButtonLink, Card, Section, StatusBadge } from "@/components/ui";
import { BuyerOnboardingSteps } from "@/components/onboarding";

export default function BuyerOnboardingCompletePage() {
  return (
    <AppShell>
      <Section className="max-w-2xl">
        <BuyerOnboardingSteps current="complete" />
        <Card>
          <Clock className="text-teal-700" />
          <h1 className="mt-4 text-2xl font-semibold">Profile submitted for review</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your buyer profile is under admin review. You can request showings after email,
            identity, and financial verification are all approved.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge status="email_verified" />
            <StatusBadge status="identity_pending_review" />
            <StatusBadge status="financial_pending_review" />
          </div>
          <div className="mt-6">
            <ButtonLink href="/buyer/dashboard">Go to dashboard</ButtonLink>
          </div>
        </Card>
      </Section>
    </AppShell>
  );
}
