import { BadgeCheck } from "lucide-react";
import { FileField } from "@/components/file-field";
import { AgentOnboardingSteps } from "@/components/onboarding";
import { AppShell, Card, Field, Section } from "@/components/ui";

export default function AgentLicenseStepPage() {
  return (
    <AppShell>
      <Section className="max-w-3xl">
        <AgentOnboardingSteps current="license" />
        <div className="mb-6 flex items-center gap-3">
          <BadgeCheck className="text-teal-700" />
          <div>
            <h1 className="text-2xl font-semibold">License verification</h1>
            <p className="text-sm text-slate-600">License details are stored pending admin review.</p>
          </div>
        </div>
        <Card>
          <form action="/api/agent/license" method="post" encType="multipart/form-data" className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Real estate license number" name="licenseNumber" />
              <Field label="Active license state" name="licenseState" placeholder="FL" />
              <Field label="License expiration date" name="licenseExpirationDate" type="date" />
              <FileField label="License upload" name="licenseFile" accept="image/*,.pdf" maxMb={3} />
            </div>
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Submit license for review
            </button>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
