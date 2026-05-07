import { CalendarClock, DoorOpen, HomeIcon, Search, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { AppShell, ButtonLink, Section } from "@/components/ui";

const heroImage =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85";

export default function Home() {
  return (
    <AppShell>
      <section className="relative min-h-[620px] overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt="Modern home interior" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="relative mx-auto flex min-h-[620px] max-w-6xl flex-col justify-center px-4 py-16 text-white">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">Showings Made Simple</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
              See the homes you want, without signing a contract.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100">
              Today&apos;s buyers are being told they must sign agreements and commit to paying thousands in agent fees before they can even step inside a house. Showings Made Simple gives you a no-pressure, $30 flat-fee way to tour homes on your terms.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup">Get started as a buyer</ButtonLink>
              <ButtonLink href="/login" variant="secondary">Login</ButtonLink>
            </div>
          </div>

          <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ["No buyer-agent agreement", "Tour homes without signing a contract or agreeing to pay a commission."],
              ["$30 flat fee", "A simple, transparent fee for access. No surprises. No pressure."],
              ["On-demand access", "Request a showing the moment a property catches your eye."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-md border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-100">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <Section className="grid gap-5 md:grid-cols-4">
          {[
            [DoorOpen, "On-demand access", "Request a showing the moment a property catches your eye - no contracts, no commitments."],
            [WalletCards, "$30 flat fee", "Pay a simple flat fee for access. It can be reimbursed if you decide to hire a buyer's agent."],
            [CalendarClock, "Flexible timing", "Choose the time that works for your schedule, not an agent's."],
            [ShieldCheck, "Licensed access agents", "A licensed professional meets you at the property to open the door and verify access."],
          ].map(([Icon, title, body]) => (
            <div key={String(title)} className="rounded-lg border border-slate-200 bg-white p-5">
              <Icon className="text-teal-700" size={24} />
              <h2 className="mt-4 font-semibold">{String(title)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{String(body)}</p>
            </div>
          ))}
        </Section>
      </section>

      <Section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold text-teal-700">Built for buyers who are not ready to hire an agent</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            See homes first. Decide on representation later.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Many buyers are not ready to commit to one agent, sign a legal contract, agree to pay thousands in buyer-agent fees, or interview multiple agents before seeing a single home. You should not lose out on a home because you are not ready for all that.
          </p>
          <p className="mt-4 leading-7 text-slate-600">
            Showings Made Simple lets you tour homes first with less friction, then decide what kind of representation makes sense for you.
          </p>
          <div className="mt-6">
            <ButtonLink href="/signup">Start looking</ButtonLink>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            [Search, "Move faster", "Skip the back-and-forth and tour homes while they are still fresh on the market."],
            [HomeIcon, "Private tours", "Walk through the property with space to look closely and ask questions."],
            [Sparkles, "No pressure", "You are paying for access, not representation, so there is no sales pitch."],
            [ShieldCheck, "Safer showing process", "Verified buyers get a smoother, more secure showing experience while staying in control of their search and budget."],
          ].map(([Icon, title, body]) => (
            <div key={String(title)} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="text-teal-700" size={22} />
              <h3 className="mt-4 font-semibold">{String(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{String(body)}</p>
            </div>
          ))}
        </div>
      </Section>
    </AppShell>
  );
}
