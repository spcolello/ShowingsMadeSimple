import { UserPlus } from "lucide-react";
import { AppShell, Card, Field, Section } from "@/components/ui";
import { BuyerOnboardingSteps } from "@/components/onboarding";

export default async function BuyerAccountStepPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <Section className="max-w-3xl">
        <BuyerOnboardingSteps current="account" />
        <div className="mb-6 flex items-center gap-3">
          <UserPlus className="text-teal-700" />
          <div>
            <h1 className="text-2xl font-semibold">Create buyer account</h1>
            <p className="text-sm text-slate-600">
              Start in a pending state. Email must be verified before identity review.
            </p>
          </div>
        </div>
        <Card>
          {params.error && (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {params.error}
            </p>
          )}
          <form action="/api/buyer/account" method="post" className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="fullName" />
              <Field label="Email address" name="email" type="email" />
              <Field label="Phone number" name="phone" type="tel" />
              <Field label="Password" name="password" type="password" />
              <Field label="Confirm password" name="confirmPassword" type="password" />
            </div>
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Create account and send verification email
            </button>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
