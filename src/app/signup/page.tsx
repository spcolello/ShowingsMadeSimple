import { AppShell, Card, Field, Section } from "@/components/ui";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <Section className="max-w-2xl">
        <Card>
          <p className="text-sm font-semibold text-teal-700">Create account</p>
          <h1 className="mt-1 text-3xl font-semibold">Sign up</h1>
          <p className="mt-2 text-slate-600">
            Create one account, choose your role, then verify your email before continuing.
          </p>

          {params.sent === "true" && (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Check your email to verify your account.
            </p>
          )}
          {params.error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {params.error}
            </p>
          )}

          <form action="/api/auth/signup" method="post" className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="fullName" />
              <Field label="Email" name="email" type="email" />
              <Field label="Phone number" name="phone" type="tel" />
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Account type
                <select name="role" required className="min-h-11 rounded-md border border-slate-300 bg-white px-3">
                  <option value="">Choose one</option>
                  <option value="buyer">Buyer</option>
                  <option value="agent">Agent</option>
                </select>
              </label>
              <Field label="Password" name="password" type="password" />
              <Field label="Confirm password" name="confirmPassword" type="password" />
            </div>
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Create account
            </button>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
