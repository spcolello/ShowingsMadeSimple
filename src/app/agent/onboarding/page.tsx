import { BadgeCheck } from "lucide-react";
import { AppShell, ButtonLink, Card, Field, Section } from "@/components/ui";

export default function AgentOnboardingPage() {
  return (
    <AppShell>
      <Section className="max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <BadgeCheck className="text-teal-700" />
          <div>
            <h1 className="text-2xl font-semibold">Agent license profile</h1>
            <p className="text-sm text-slate-600">
              Manual license review and Stripe Connect payout onboarding placeholder.
            </p>
          </div>
        </div>
        <Card>
          <form className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" name="name" />
              <Field label="Phone number" name="phone" type="tel" />
              <Field label="License number" name="licenseNumber" />
              <Field label="Licensed state" name="licensedState" placeholder="FL" />
              <Field label="Service ZIP codes" name="serviceAreas" placeholder="33131,33132" />
              <Field label="Stripe Connect placeholder" name="stripeConnect" required={false} />
            </div>
            <label className="flex gap-3 text-sm text-slate-700">
              <input type="checkbox" name="available" className="mt-1" />
              I am available to receive showing alerts.
            </label>
            <label className="flex gap-3 text-sm text-slate-700">
              <input type="checkbox" required className="mt-1" />I accept showing safety,
              brokerage, and compliance obligations.
            </label>
            <ButtonLink href="/agent/dashboard">Submit profile</ButtonLink>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
