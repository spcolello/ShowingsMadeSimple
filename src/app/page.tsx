import { ArrowRight, BadgeCheck, BellRing, CreditCard, MapPin } from "lucide-react";
import { AppShell, ButtonLink, Card, Section, StatusBadge } from "@/components/ui";

export default function Home() {
  return (
    <AppShell>
      <Section className="grid gap-8 py-10 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-16">
        <div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            On-demand property showings for verified buyers.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Buyers request a showing, pay the fee, and nearby verified agents get an SMS alert.
            The first available agent to accept is assigned.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/signup">Sign up / Get started</ButtonLink>
            <ButtonLink href="/login" variant="secondary">Login</ButtonLink>
          </div>
        </div>

        <Card className="grid gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Live request</p>
              <h2 className="mt-1 text-xl font-semibold">123 House Street</h2>
            </div>
            <StatusBadge status="pending" />
          </div>
          <div className="grid gap-3 text-sm text-slate-700">
            <p className="flex items-center gap-2">
              <MapPin size={18} /> Amsterdam, NY 12010
            </p>
            <p className="flex items-center gap-2">
              <CreditCard size={18} /> Buyer payment captured
            </p>
            <p className="flex items-center gap-2">
              <BellRing size={18} /> 2 matching agents notified
            </p>
            <p className="flex items-center gap-2">
              <BadgeCheck size={18} /> License and buyer records retained
            </p>
          </div>
          <ButtonLink href="/agent/accept/demo-showing-1">
            Preview accept flow (this does not work rn) <ArrowRight size={16} />
          </ButtonLink>
        </Card>
      </Section>

      <section className="border-y border-slate-200 bg-white">
        <Section className="grid gap-4 md:grid-cols-4">
          {[
            ["Verify", "Collect buyer identity, phone, terms, and document placeholders."],
            ["Request", "Capture address, time, notes, attendees, and serious-interest confirmation."],
            ["Match", "Find verified, available agents by ZIP/service area and send SMS alerts."],
            ["Assign", "First accept wins. Other agents see that the showing is no longer available."],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </Section>
      </section>
    </AppShell>
  );
}
