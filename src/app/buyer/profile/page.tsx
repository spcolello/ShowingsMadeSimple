import { AppShell, Card, Field, Section, StatusBadge } from "@/components/ui";
import { demoBuyer, demoDocuments } from "@/lib/demo-data";

export default function BuyerProfilePage() {
  const documents = demoDocuments.filter((document) => document.ownerId === demoBuyer.id);

  return (
    <AppShell>
      <Section className="max-w-3xl">
        <h1 className="text-3xl font-semibold">Buyer profile</h1>
        <p className="mt-2 text-slate-600">
          Email/password login, email verification, and phone verification are handled by Supabase
          auth plus the profile status fields below.
        </p>
        <Card className="mt-6">
          <form className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="fullName" placeholder={demoBuyer.fullName} />
              <Field label="Email" name="email" type="email" placeholder={demoBuyer.email} />
              <Field label="Phone" name="phone" type="tel" placeholder={demoBuyer.phone} />
              <Field
                label="Street address"
                name="street"
                placeholder={demoBuyer.address.street}
              />
              <Field label="City" name="city" placeholder={demoBuyer.address.city} />
              <Field label="State" name="state" placeholder={demoBuyer.address.state} />
              <Field label="ZIP code" name="zipCode" placeholder={demoBuyer.address.zipCode} />
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={`identity_${demoBuyer.identityVerificationStatus}`} />
              <StatusBadge status={`financial_${demoBuyer.financialVerificationStatus}`} />
            </div>
          </form>
        </Card>
        <Card className="mt-4">
          <h2 className="font-semibold">Verification documents</h2>
          <div className="mt-4 grid gap-3">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                <span className="text-sm">{document.type.replaceAll("_", " ")}</span>
                <StatusBadge status={document.status} />
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </AppShell>
  );
}
