import Link from "next/link";
import { clsx } from "clsx";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
            Showings Made Simple
          </Link>
          <div className="hidden items-center gap-4 text-sm font-medium text-slate-600 sm:flex">
            <Link href="/buyer/dashboard">Buyer</Link>
            <Link href="/buyer/profile">Profile</Link>
            <Link href="/agent/dashboard">Agent</Link>
            <Link href="/admin">Admin</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={clsx("mx-auto max-w-6xl px-4 py-8", className)}>{children}</section>;
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-lg border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold",
        variant === "primary"
          ? "bg-teal-700 text-white hover:bg-teal-800"
          : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
      )}
    >
      {children}
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const color =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "agent_assigned" || status === "paid" || status === "held" || status === "released"
        ? "bg-blue-50 text-blue-700 ring-blue-200"
        : status === "cancelled" || status === "disputed" || status === "rejected"
          ? "bg-red-50 text-red-700 ring-red-200"
          : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1", color)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 shadow-sm"
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <textarea
        name={name}
        rows={4}
        placeholder={placeholder}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
      />
    </label>
  );
}
