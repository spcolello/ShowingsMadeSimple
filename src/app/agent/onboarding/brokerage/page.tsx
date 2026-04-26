import { Building2 } from "lucide-react";
import { AgentOnboardingSteps } from "@/components/onboarding";
import { AppShell, Card, Field, Section } from "@/components/ui";

export default function AgentBrokerageStepPage() {
  return (
    <AppShell>
      <Section className="max-w-3xl">
        <AgentOnboardingSteps current="brokerage" />
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="text-teal-700" />
          <div>
            <h1 className="text-2xl font-semibold">Brokerage verification</h1>
            <p className="text-sm text-slate-600">Brokerage details remain pending until reviewed or confirmed.</p>
          </div>
        </div>
        <Card>
          <form action="/api/agent/brokerage" method="post" className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brokerage name" name="brokerageName" />
              <Field label="Brokerage address" name="brokerageAddress" />
              <Field label="Broker/manager name" name="brokerManagerName" />
              <Field label="Broker/manager email" name="brokerManagerEmail" type="email" />
              <Field label="Broker/manager phone number" name="brokerManagerPhone" type="tel" />
            </div>
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Submit brokerage details
            </button>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
