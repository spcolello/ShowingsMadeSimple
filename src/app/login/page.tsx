import { AppShell, ButtonLink, Card, Field, Section } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; verify?: string; resent?: string; verified?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <Section className="max-w-xl">
        <Card>
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Log in with the email and password used during signup. Development mock admin is
            available locally only.
          </p>
          {params.verified === "true" && (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Email verified. You can log in now.
            </p>
          )}
          {params.resent === "true" && (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Verification email resent.
            </p>
          )}
          {params.verify && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p>Email verification required. Check your inbox before logging in.</p>
              <form action="/api/auth/resend-verification" method="post" className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="email" value={params.verify} />
                <button className="min-h-10 rounded-md border border-amber-300 px-3 text-sm font-semibold">
                  Resend verification email
                </button>
              </form>
            </div>
          )}
          {params.error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {params.error}
            </p>
          )}
          <form action="/api/auth/login" method="post" className="mt-6 grid gap-4">
            <Field label="Email address" name="email" type="email" />
            <Field label="Password" name="password" type="password" />
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Login
            </button>
          </form>
          <a href="/forgot-password" className="mt-3 inline-block text-sm font-semibold text-teal-700">
            Forgot password?
          </a>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <ButtonLink href="/signup" variant="secondary">Create account</ButtonLink>
          </div>
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-slate-700">Demo/mock access for development</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                ["buyer", "Mock Buyer Dashboard"],
                ["agent", "Mock Agent Dashboard"],
                ["admin", "Admin"],
              ].map(([role, label]) => (
                <form key={role} action="/api/auth/mock-access" method="post">
                  <input type="hidden" name="role" value={role} />
                  <button className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-100">
                    {label}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </Card>
      </Section>
    </AppShell>
  );
}
