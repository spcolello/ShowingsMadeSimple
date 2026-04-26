import { FileText } from "lucide-react";
import { AgentOnboardingSteps } from "@/components/onboarding";
import { AppShell, Card, Field, Section } from "@/components/ui";

export default function AgentTaxStepPage() {
  return (
    <AppShell>
      <Section className="max-w-2xl">
        <AgentOnboardingSteps current="tax" />
        <Card>
          <FileText className="text-teal-700" />
          <h1 className="mt-4 text-2xl font-semibold">Upload W-9</h1>
          <p className="mt-2 text-sm text-slate-600">
            A completed W-9 is required before payouts can be enabled.
          </p>
          <form action="/api/agent/tax" method="post" encType="multipart/form-data" className="mt-6 grid gap-4">
            <Field label="Completed W-9 upload" name="w9File" type="file" />
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Submit W-9
            </button>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
