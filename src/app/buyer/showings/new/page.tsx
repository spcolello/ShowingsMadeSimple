import { AppShell, Card, Field, Section, TextArea } from "@/components/ui";

export default function NewShowingPage() {
  return (
    <AppShell>
      <Section className="max-w-3xl">
        <h1 className="text-3xl font-semibold">Request a showing</h1>
        <p className="mt-2 text-slate-600">
          Payment is collected before matching agents. Local demo mode returns a mock checkout URL.
        </p>
        <Card className="mt-6">
          <form action="/api/showings" method="post" className="grid gap-4">
            <Field label="Property address" name="propertyAddress" placeholder="88 Brickell Plaza, Miami, FL" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="ZIP code" name="zipCode" placeholder="33131" />
              <Field label="Preferred date/time" name="preferredTime" type="datetime-local" />
              <Field label="Number of attendees" name="attendees" type="number" placeholder="2" />
            </div>
            <TextArea label="Notes" name="notes" placeholder="Access instructions, parking, timing constraints" />
            <label className="flex gap-3 text-sm text-slate-700">
              <input type="checkbox" name="seriousInterest" value="true" required className="mt-1" />I am
              seriously interested in this property and agree to showing terms.
            </label>
            <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
              Continue to payment
            </button>
          </form>
        </Card>
      </Section>
    </AppShell>
  );
}
