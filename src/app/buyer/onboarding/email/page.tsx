import { MailCheck } from "lucide-react";
import { AppShell, Card, Section } from "@/components/ui";
import { BuyerOnboardingSteps } from "@/components/onboarding";

export default async function BuyerEmailVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; verified?: string; resent?: string }>;
}) {
  const params = await searchParams;
  const email = params.email ?? "your email";
  const verified = params.verified === "true";

  return (
    <AppShell>
      <Section className="max-w-2xl">
        <BuyerOnboardingSteps current="email" />
        <Card>
          <MailCheck className="text-teal-700" />
          <h1 className="mt-4 text-2xl font-semibold">
            {verified ? "Email verified" : "Check your email"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {verified
              ? "Your email is verified. Continue to identity verification."
              : `We sent a verification link or code to ${email}. Local mock code: 123456.`}
          </p>

          {params.error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {params.error}
            </p>
          )}
          {params.resent === "true" && (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Verification email resent.
            </p>
          )}

          {!verified ? (
            <div className="mt-6 grid gap-3">
              <form action="/api/buyer/email-verification" method="post" className="grid gap-3">
                <input type="hidden" name="email" value={email} />
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  Verification code
                  <input
                    name="code"
                    placeholder="123456"
                    className="min-h-11 rounded-md border border-slate-300 px-3"
                  />
                </label>
                <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                  Verify email
                </button>
              </form>
              <form action="/api/buyer/email-verification" method="post">
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="resend" value="true" />
                <button className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100">
                  Resend verification email
                </button>
              </form>
            </div>
          ) : (
            <a
              href="/buyer/onboarding/identity"
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Continue to identity verification
            </a>
          )}
        </Card>
      </Section>
    </AppShell>
  );
}
