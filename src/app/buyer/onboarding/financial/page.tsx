import { CreditCard } from "lucide-react";
import { AppShell, Card, Field, Section } from "@/components/ui";
import { BuyerOnboardingSteps } from "@/components/onboarding";

export default function BuyerFinancialStepPage() {
  return (
    <AppShell>
      <Section className="max-w-3xl">
        <BuyerOnboardingSteps current="financial" />
        <div className="mb-6 flex items-center gap-3">
          <CreditCard className="text-teal-700" />
          <div>
            <h1 className="text-2xl font-semibold">Financial verification</h1>
            <p className="text-sm text-slate-600">
              Choose one readiness path. No lender integration is included in the MVP.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Option A: Soft credit check</h2>
            <form action="/api/buyer/financial" method="post" className="mt-4 grid gap-4">
              <input type="hidden" name="method" value="soft_credit_check" />
              <label className="flex gap-3 text-sm text-slate-700">
                <input type="checkbox" name="softCreditCheckConsent" value="true" required className="mt-1" />
                I consent to a soft credit check. This does not affect my credit score.
              </label>
              <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                Submit consent
              </button>
            </form>
          </Card>
          <Card>
            <h2 className="font-semibold">Option B: Pre-qualification letter</h2>
            <form action="/api/buyer/financial" method="post" encType="multipart/form-data" className="mt-4 grid gap-4">
              <input type="hidden" name="method" value="prequalification_letter" />
              <Field label="Upload PDF, image, or document" name="prequalificationLetter" type="file" />
              <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                Upload letter
              </button>
            </form>
          </Card>
        </div>
      </Section>
    </AppShell>
  );
}
