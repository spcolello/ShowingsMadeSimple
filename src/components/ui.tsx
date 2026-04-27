import Link from "next/link";
import { clsx } from "clsx";
import { cookies } from "next/headers";
import { Settings, UserCircle } from "lucide-react";

function dashboardPathForRole(role?: string) {
  if (role === "buyer") {
    return "/buyer/dashboard";
  }
  if (role === "agent") {
    return "/agent/dashboard";
  }
  if (role === "admin") {
    return "/admin";
  }
  return "/login";
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const role = cookieStore.get("sms_demo_role")?.value;
  const isLoggedIn = Boolean(role);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
            Showings Made Simple
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardPathForRole(role)}
                  aria-label="Open profile dashboard"
                  title="Profile"
                  className="inline-flex size-10 items-center justify-center rounded-md border border-slate-300 text-slate-800 hover:bg-slate-100"
                >
                  <UserCircle size={20} />
                </Link>
                <details className="group relative">
                  <summary
                    aria-label="Open settings"
                    title="Settings"
                    className="inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-slate-300 text-slate-800 hover:bg-slate-100 [&::-webkit-details-marker]:hidden"
                  >
                    <Settings size={19} />
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                    <form action="/api/auth/logout" method="post">
                      <button className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100">
                        Log out
                      </button>
                    </form>
                  </div>
                </details>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="hidden min-h-10 items-center rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800 sm:inline-flex"
                >
                  Sign up / Get started
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Login
                </Link>
              </>
            )}
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
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-lg border border-slate-200 bg-white p-5 shadow-sm", className)} {...props}>
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
  const normalizedStatus = status.toLowerCase();
  const isPositive =
    normalizedStatus.includes("approved") ||
    normalizedStatus.includes("accepted") ||
    normalizedStatus.includes("verified") ||
    normalizedStatus.includes("ready") ||
    normalizedStatus === "completed" ||
    normalizedStatus === "released" ||
    normalizedStatus === "available";
  const color =
    isPositive
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "agent_assigned" || status === "paid" || status === "held"
        ? "bg-blue-50 text-blue-700 ring-blue-200"
      : normalizedStatus.includes("rejected") ||
          normalizedStatus.includes("denied") ||
          normalizedStatus.includes("suspended") ||
          status === "cancelled" ||
          status === "disputed"
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
  defaultValue,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
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
