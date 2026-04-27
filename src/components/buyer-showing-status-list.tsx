"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/demo-data";

export type BuyerShowingStatusItem = {
  id: string;
  propertyAddress?: string | null;
  mlsNumber?: string | null;
  zipCode?: string | null;
  preferredTime: string;
  status: string;
  paymentStatus: string;
  showingFeeCents: number;
  assignedAgentId?: string | null;
  agentName?: string | null;
};

function StatusPill({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const isPositive =
    normalizedStatus.includes("approved") ||
    normalizedStatus.includes("accepted") ||
    normalizedStatus.includes("verified") ||
    normalizedStatus.includes("ready") ||
    normalizedStatus === "completed" ||
    normalizedStatus === "released" ||
    normalizedStatus === "available";
  const color = isPositive
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
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${color}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function BuyerShowingStatusList({
  initialShowings,
}: {
  initialShowings: BuyerShowingStatusItem[];
}) {
  const [showings, setShowings] = useState(initialShowings);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const label = useMemo(() => {
    if (!updatedAt) return "Status checks every 10 seconds";
    return `Updated ${updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`;
  }, [updatedAt]);

  useEffect(() => {
    let cancelled = false;

    async function refreshShowings() {
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        const response = await fetch("/api/buyer/showings/status", { cache: "no-store" });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "Showing statuses could not be refreshed.");
        }

        if (!cancelled) {
          setShowings(body.showings ?? []);
          setUpdatedAt(new Date(body.updatedAt ?? Date.now()));
          setError("");
        }
      } catch (refreshError) {
        if (!cancelled) {
          setError(refreshError instanceof Error ? refreshError.message : "Showing statuses could not be refreshed.");
        }
      }
    }

    const interval = window.setInterval(refreshShowings, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="font-semibold">Your showing requests</h2>
          <p className="mt-1 text-xs text-slate-500">{label}</p>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
      <div className="grid grid-cols-1 gap-0 divide-y divide-slate-200">
        {showings.length === 0 && (
          <div className="p-4 text-sm text-slate-600">
            No showing requests yet. Approved buyers can request a showing from the property search tab.
          </div>
        )}
        {showings.map((showing) => (
          <Link
            key={showing.id}
            href={`/buyer/showings/${showing.id}`}
            className="grid gap-3 p-4 hover:bg-slate-50 md:grid-cols-[1.3fr_0.7fr_0.7fr_auto] md:items-center"
          >
            <div>
              <p className="font-semibold">{showing.propertyAddress ?? showing.mlsNumber}</p>
              <p className="text-sm text-slate-600">
                {showing.mlsNumber ? `MLS ${showing.mlsNumber} - ` : ""}
                {showing.zipCode}
              </p>
            </div>
            <p className="text-sm text-slate-700">{new Date(showing.preferredTime).toLocaleString()}</p>
            <p className="text-sm text-slate-700">{showing.agentName ? `Agent: ${showing.agentName}` : "Awaiting agent"}</p>
            <div className="flex items-center gap-3">
              <StatusPill status={showing.status} />
              <span className="text-sm text-slate-500">
                {formatMoney(showing.showingFeeCents)} - {showing.paymentStatus}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
