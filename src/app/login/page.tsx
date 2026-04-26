import { AppShell, ButtonLink, Card, Field, Section } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <Section className="max-w-xl">
        <Card>
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Development admin login: admin@gmail.com / admin. Production should use Supabase auth.
          </p>
          {params.error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {params.error}
            </p>
          )}
          <form action="/api/auth/mock-login" method="post" className="mt-6 grid gap-4">
            <Field label="Email address" name="email" type="email" />
            <Field label="Password" name="password" type="password" />
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Login
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <ButtonLink href="/buyer/dashboard" variant="secondary">Buyer dashboard</ButtonLink>
            <ButtonLink href="/agent/dashboard" variant="secondary">Agent dashboard</ButtonLink>
          </div>
        </Card>
      </Section>
    </AppShell>
  );
}
