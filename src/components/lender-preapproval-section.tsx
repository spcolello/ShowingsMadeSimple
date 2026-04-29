"use client";

import { useEffect, useState } from "react";
import type { Lender } from "@/lib/lenders";
import { lenderDisclaimer } from "@/lib/lenders";
import type { Property } from "@/lib/property-types";

const incomeRanges = ["Under $75k", "$75k-$125k", "$125k-$200k", "$200k+"];
const creditRanges = ["Under 620", "620-679", "680-739", "740+"];
const downPaymentRanges = ["Under 5%", "5%-10%", "10%-20%", "20%+"];
const timelines = ["ASAP", "30-60 days", "60-90 days", "3+ months"];

export function LenderPreapprovalSection({ property }: { property: Property }) {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLenders() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/lenders/match?propertyId=${property.id}`, { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Lenders could not be loaded.");
        }
        if (!cancelled) {
          setLenders(body.lenders ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Lenders could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadLenders();
    return () => {
      cancelled = true;
    };
  }, [property.id]);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLender) return;

    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/preapproval-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          lenderId: selectedLender.id,
          propertyAddress: property.address,
          propertyCity: property.city,
          propertyState: property.state,
          propertyZip: property.zip,
          targetPurchasePrice: property.price,
          buyerIncomeRange: String(form.get("buyerIncomeRange") ?? ""),
          buyerCreditRange: String(form.get("buyerCreditRange") ?? ""),
          buyerDownPaymentRange: String(form.get("buyerDownPaymentRange") ?? ""),
          buyerTimeline: String(form.get("buyerTimeline") ?? ""),
          buyerPhone: String(form.get("buyerPhone") ?? ""),
          buyerEmail: String(form.get("buyerEmail") ?? ""),
          consentToContact: form.get("consentToContact") === "true",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Pre-approval request could not be sent.");
      }

      setSuccess(body.message ?? `Your request was sent to ${selectedLender.companyName}. They should contact you soon.`);
      setSelectedLender(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Pre-approval request could not be sent.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-lg font-semibold">Get Pre-Approved for This Home</h3>
        <p className="mt-1 text-sm text-slate-600">
          Matched by the property location: {property.city}, {property.state} {property.zip}
        </p>
      </div>

      {success && <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
      {error && <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {isLoading && <p className="mt-3 text-sm text-slate-600">Loading pre-approval partners...</p>}

      {!isLoading && lenders.length === 0 && (
        <p className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">
          No pre-approval partners are available for this property yet.
        </p>
      )}

      {lenders.length > 0 && (
        <div className="mt-4 grid gap-3">
          {lenders.map((lender) => (
            <article key={lender.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{lender.companyName}</p>
                  <p className="mt-1 text-sm text-slate-600">NMLS {lender.nmlsId}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {lender.licensedStates.map((state) => (
                    <span key={state} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                      {state}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">Average response: {lender.averageResponseMinutes} minutes</p>
              <p className="mt-2 text-sm text-slate-700">{lender.loanTypes.join(", ")}</p>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setSelectedLender(lender);
                }}
                className="mt-3 min-h-10 w-full rounded-md border border-teal-700 px-3 text-sm font-semibold text-teal-700 hover:bg-teal-50"
              >
                Request Pre-Approval
              </button>
            </article>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">{lenderDisclaimer}</p>

      {selectedLender && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">Request pre-approval</h3>
                <p className="mt-1 text-sm text-slate-600">{selectedLender.companyName}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedLender(null)}
                className="grid size-8 place-items-center rounded-full border border-slate-300 text-lg font-semibold hover:bg-slate-100"
              >
                x
              </button>
            </div>
            <form onSubmit={submitRequest} className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField name="buyerIncomeRange" label="Income range" options={incomeRanges} />
                <SelectField name="buyerCreditRange" label="Estimated credit range" options={creditRanges} />
                <SelectField name="buyerDownPaymentRange" label="Down payment range" options={downPaymentRanges} />
                <SelectField name="buyerTimeline" label="Buying timeline" options={timelines} />
              </div>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Phone number
                <input name="buyerPhone" required className="min-h-11 rounded-md border border-slate-300 px-3" />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Email
                <input name="buyerEmail" type="email" required className="min-h-11 rounded-md border border-slate-300 px-3" />
              </label>
              <label className="flex gap-3 text-sm text-slate-700">
                <input type="checkbox" name="consentToContact" value="true" required className="mt-1" />
                I agree to be contacted by this lender about mortgage pre-approval.
              </label>
              <p className="text-xs leading-5 text-slate-500">{lenderDisclaimer}</p>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLender(null)}
                  className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400"
                >
                  {isSubmitting ? "Sending..." : "Send request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <select name={name} required className="min-h-11 rounded-md border border-slate-300 bg-white px-3">
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
