import { AppShell, Card, Field, Section } from "@/components/ui";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <Section className="max-w-xl">
        <Card>
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your account email and we will send a Supabase password reset link.
          </p>
          {params.sent === "true" && (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Password reset email sent.
            </p>
          )}
          {params.error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {params.error}
            </p>
          )}
          <form action="/api/auth/forgot-password" method="post" className="mt-6 grid gap-4">
            <Field label="Email address" name="email" type="email" />
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Send reset email
            </button>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
