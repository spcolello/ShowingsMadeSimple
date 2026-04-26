import { Building2, Home } from "lucide-react";
import { AppShell, ButtonLink, Card, Section } from "@/components/ui";

export default function SignupPage() {
  return (
    <AppShell>
      <Section className="max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-700">Create account</p>
          <h1 className="mt-1 text-3xl font-semibold">Are you a buyer or an agent?</h1>
          <p className="mt-2 text-slate-600">
            Choose the account type that matches how you will use Showings Made Simple.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <Home className="text-teal-700" />
            <h2 className="mt-4 text-xl font-semibold">I am a buyer</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Verify your email, identity, and financial readiness before requesting showings.
            </p>
            <div className="mt-5">
              <ButtonLink href="/buyer/onboarding">Continue as buyer</ButtonLink>
            </div>
          </Card>
          <Card>
            <Building2 className="text-teal-700" />
            <h2 className="mt-4 text-xl font-semibold">I am an agent</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Submit your license, brokerage, W-9, payout setup, and availability.
            </p>
            <div className="mt-5">
              <ButtonLink href="/agent/onboarding">Continue as agent</ButtonLink>
            </div>
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
