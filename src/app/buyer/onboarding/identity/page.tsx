import { ShieldCheck } from "lucide-react";
import { AppShell, Card, Field, Section } from "@/components/ui";
import { BuyerOnboardingSteps } from "@/components/onboarding";

export default function BuyerIdentityStepPage() {
  return (
    <AppShell>
      <Section className="max-w-3xl">
        <BuyerOnboardingSteps current="identity" />
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="text-teal-700" />
          <div>
            <h1 className="text-2xl font-semibold">Identity verification</h1>
            <p className="text-sm text-slate-600">
              Upload identity documents and confirm your address for admin review.
            </p>
          </div>
        </div>
        <Card>
          <form action="/api/buyer/identity" method="post" encType="multipart/form-data" className="grid gap-4">
            <Field label="Government ID upload" name="governmentId" type="file" />
            <Field label="Selfie upload or capture" name="selfie" type="file" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Street address" name="street" />
              <Field label="City" name="city" />
              <Field label="State" name="state" placeholder="FL" />
              <Field label="ZIP code" name="zipCode" />
            </div>
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Submit identity for review
            </button>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
