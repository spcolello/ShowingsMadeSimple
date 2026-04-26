import { AppShell, ButtonLink, Card, Field, Section } from "@/components/ui";

export default function BuyerLoginPage() {
  return (
    <AppShell>
      <Section className="max-w-xl">
        <Card>
          <h1 className="text-2xl font-semibold">Buyer login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Supabase email auth is wired through the data model. This demo button opens the buyer
            dashboard.
          </p>
          <form className="mt-6 grid gap-4">
            <Field label="Email" name="email" type="email" placeholder="maya@example.com" />
            <Field label="Password" name="password" type="password" />
            <ButtonLink href="/buyer/dashboard">Continue to buyer dashboard</ButtonLink>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
