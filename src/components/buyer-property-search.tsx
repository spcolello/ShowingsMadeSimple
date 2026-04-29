"use client";

import { useEffect, useMemo, useState } from "react";
import { LenderPreapprovalSection } from "@/components/lender-preapproval-section";
import type { Property } from "@/lib/property-types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function BuyerPropertySearch() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/properties", { cache: "no-store" });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "Properties could not be loaded.");
        }

        if (!cancelled) {
          setProperties(body.properties ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Properties could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProperties();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return properties;
    }

    return properties.filter((property) => {
      const searchable = [
        property.address,
        property.city,
        property.state,
        property.zip,
        property.mlsNumber ?? "",
      ].join(" ").toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [properties, query]);

  return (
    <div>
      <div className="mb-5">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Search by MLS number or address
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="A11550103 or 1010 Brickell"
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 shadow-sm"
          />
        </label>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {isLoading && <p className="text-sm text-slate-600">Loading properties...</p>}
      {!isLoading && results.length === 0 && (
        <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-600">
          No seeded properties match that MLS number or address.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {results.map((property) => (
          <article key={property.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {property.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={property.imageUrl} alt={property.address} className="h-40 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{currency.format(property.price)}</p>
                  <p className="mt-1 font-medium">{property.address}</p>
                  <p className="text-sm text-slate-600">
                    {property.city}, {property.state} {property.zip}
                  </p>
                </div>
                {property.mlsNumber && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    MLS {property.mlsNumber}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-slate-700">
                {property.beds} beds - {property.baths} baths
              </p>
              <button
                type="button"
                onClick={() => setSelectedProperty(property)}
                className="mt-4 min-h-10 w-full rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Request Showing
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedProperty && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Request showing</h2>
                <p className="mt-1 text-sm text-slate-600">{selectedProperty.address}</p>
                {selectedProperty.mlsNumber && (
                  <p className="mt-1 text-xs font-semibold text-slate-500">MLS {selectedProperty.mlsNumber}</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedProperty(null)}
                className="grid size-8 place-items-center rounded-full border border-slate-300 text-lg font-semibold hover:bg-slate-100"
              >
                x
              </button>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <form action="/api/showings" method="post" className="grid gap-4 rounded-lg border border-slate-200 p-4">
                <div>
                  <h3 className="font-semibold">Choose showing time</h3>
                  <p className="mt-1 text-sm text-slate-600">Pick the time you would like the agent to target.</p>
                </div>
                <input type="hidden" name="propertyAddress" value={selectedProperty.address} />
                <input type="hidden" name="mlsNumber" value={selectedProperty.mlsNumber ?? ""} />
                <input
                  type="hidden"
                  name="propertySummary"
                  value={`${selectedProperty.beds} bed, ${selectedProperty.baths} bath buyer-selected seeded property`}
                />
                <input type="hidden" name="zipCode" value={selectedProperty.zip} />
                <input type="hidden" name="attendees" value="1" />
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Preferred showing time
                  <input name="preferredTime" type="datetime-local" required className="min-h-11 rounded-md border border-slate-300 px-3" />
                  <span className="text-xs font-normal leading-5 text-slate-500">
                    This is your preferred time. The assigned agent will try to accommodate it, but the final appointment may shift based on seller access requirements.
                  </span>
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Safety notes
                  <textarea name="safetyNotes" rows={3} className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="flex gap-3 text-sm text-slate-700">
                  <input type="checkbox" name="seriousInterest" value="true" required className="mt-1" />
                  I am seriously interested in this property and agree to the safety and showing terms.
                </label>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProperty(null)}
                    className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                    Continue to payment
                  </button>
                </div>
              </form>
              <LenderPreapprovalSection property={selectedProperty} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
