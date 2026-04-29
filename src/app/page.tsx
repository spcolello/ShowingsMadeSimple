import { CalendarClock, DoorOpen, HomeIcon, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell, ButtonLink, Section } from "@/components/ui";

const heroImage =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85";

export default function Home() {
  return (
    <AppShell>
      <section className="relative min-h-[620px] overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt="Modern home interior" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative mx-auto flex min-h-[620px] max-w-6xl flex-col justify-center px-4 py-16 text-white">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">Showings Made Simple</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
              See the homes you want, when you want.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100">
              Showings Made Simple helps serious buyers tour homes without waiting on back-and-forth scheduling. Request a private showing and get connected with a licensed local agent who can open the door.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup">Get started as a buyer</ButtonLink>
              <ButtonLink href="/login" variant="secondary">Login</ButtonLink>
            </div>
          </div>

          <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ["On-demand access", "Request a showing when a property catches your eye."],
              ["Flexible timing", "Choose the time that works for your day."],
              ["Local agent support", "A licensed agent meets you at the property."],
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
            [DoorOpen, "Tour more homes", "See properties while they are still fresh on the market."],
            [CalendarClock, "Move faster", "Cut down the waiting and coordination that slows buyers down."],
            [MapPin, "Shop your market", "Explore homes near where you live, work, and spend time."],
            [ShieldCheck, "Feel prepared", "Verified buyers get a safer, more serious showing experience."],
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
          <p className="text-sm font-semibold text-teal-700">Built for serious buyers</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            House hunting should not depend on someone else’s calendar.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            When you find a place worth seeing, you should be able to act quickly. Showings Made Simple gives buyers a direct way to request access, confirm the appointment, and keep moving.
          </p>
          <div className="mt-6">
            <ButtonLink href="/signup">Start looking</ButtonLink>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            [Search, "See it sooner", "Request showings before your interest fades or the home gets claimed."],
            [HomeIcon, "Private tours", "Walk through the property with room to ask questions and look closely."],
            [Sparkles, "Less friction", "No long email chains just to find out whether a showing is possible."],
            [ShieldCheck, "Buyer-focused", "Designed for buyers who are ready to tour seriously and safely."],
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
