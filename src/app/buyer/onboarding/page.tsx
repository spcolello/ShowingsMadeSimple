import { ShieldCheck } from "lucide-react";
import { AppShell, ButtonLink, Card, Field, Section } from "@/components/ui";

export default function BuyerOnboardingPage() {
  return (
    <AppShell>
      <Section className="max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="text-teal-700" />
          <div>
            <h1 className="text-2xl font-semibold">Buyer verification</h1>
            <p className="text-sm text-slate-600">Keep every showing safer before payment.</p>
          </div>
        </div>
        <Card>
          <form className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="fullName" />
              <Field label="Phone number" name="phone" type="tel" />
              <Field label="Email" name="email" type="email" />
              <Field label="Phone verification code" name="phoneCode" placeholder="123456" />
              <Field label="Address confirmation" name="addressConfirmation" placeholder="Current home address" />
            </div>
            <Field label="Government ID upload" name="governmentId" type="file" />
            <Field label="Selfie upload for identity match" name="selfie" type="file" />
            <Field
              label="Pre-qualification letter upload"
              name="proofOfFunds"
              type="file"
              required={false}
            />
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Soft credit check status
              <select name="softCreditStatus" className="min-h-11 rounded-md border border-slate-300 bg-white px-3">
                <option>not_started</option>
                <option>pending_review</option>
                <option>verified</option>
                <option>rejected</option>
              </select>
            </label>
            <label className="flex gap-3 text-sm text-slate-700">
              <input type="checkbox" required className="mt-1" />
              I agree to safety rules, showing terms, and truthful buyer information.
            </label>
            <ButtonLink href="/buyer/showings/new">Submit and request a showing</ButtonLink>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
