import { AppShell, ButtonLink, Card, Field, Section } from "@/components/ui";

export default function AgentLoginPage() {
  return (
    <AppShell>
      <Section className="max-w-xl">
        <Card>
          <h1 className="text-2xl font-semibold">Agent login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Agents authenticate with Supabase, then complete license and payout profile steps.
          </p>
          <form className="mt-6 grid gap-4">
            <Field label="Email" name="email" type="email" placeholder="sam@example.com" />
            <Field label="Password" name="password" type="password" />
            <ButtonLink href="/agent/dashboard">Continue to agent dashboard</ButtonLink>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
