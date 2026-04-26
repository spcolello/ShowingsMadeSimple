import { CheckCircle2, Circle } from "lucide-react";
import { clsx } from "clsx";

const steps = [
  ["account", "Account"],
  ["email", "Email"],
  ["identity", "Identity"],
  ["financial", "Financial"],
  ["complete", "Review"],
];

export function BuyerOnboardingSteps({ current }: { current: string }) {
  const currentIndex = steps.findIndex(([key]) => key === current);

  return (
    <ol className="mb-6 grid gap-2 sm:grid-cols-5">
      {steps.map(([key, label], index) => {
        const done = index < currentIndex;
        const active = key === current;
        return (
          <li
            key={key}
            className={clsx(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              active
                ? "border-teal-700 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-600",
            )}
          >
            {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {label}
          </li>
        );
      })}
    </ol>
  );
}

const agentSteps = [
  ["account", "Account"],
  ["email", "Email"],
  ["license", "License"],
  ["brokerage", "Brokerage"],
  ["tax", "W-9"],
  ["payout", "Payouts"],
  ["complete", "Review"],
];

export function AgentOnboardingSteps({ current }: { current: string }) {
  const currentIndex = agentSteps.findIndex(([key]) => key === current);

  return (
    <ol className="mb-6 grid gap-2 sm:grid-cols-7">
      {agentSteps.map(([key, label], index) => {
        const done = index < currentIndex;
        const active = key === current;
        return (
          <li
            key={key}
            className={clsx(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              active
                ? "border-teal-700 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-600",
            )}
          >
            {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {label}
          </li>
        );
      })}
    </ol>
  );
}
