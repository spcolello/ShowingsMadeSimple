"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Property } from "@/lib/property-types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function BuyerPropertyMap({ mapboxToken }: { mapboxToken?: string }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapStatus, setMapStatus] = useState(mapboxToken ? "Loading map..." : "Mapbox token missing.");
  const [showFallbackMap, setShowFallbackMap] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: "",
    minBeds: "",
    minBaths: "",
    location: "",
  });

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
          setSelectedProperty(body.properties?.[0] ?? null);
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

  const visibleProperties = useMemo(() => {
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;
    const minBeds = filters.minBeds ? Number(filters.minBeds) : null;
    const minBaths = filters.minBaths ? Number(filters.minBaths) : null;
    const location = filters.location.trim().toLowerCase();

    return properties.filter((property) => {
      const locationText = `${property.address} ${property.city} ${property.zip} ${property.mlsNumber ?? ""}`.toLowerCase();
      return (
        (!maxPrice || property.price <= maxPrice) &&
        (!minBeds || property.beds >= minBeds) &&
        (!minBaths || property.baths >= minBaths) &&
        (!location || locationText.includes(location))
      );
    });
  }, [filters, properties]);

  const fallbackBounds = useMemo(() => {
    const source = visibleProperties.length > 0 ? visibleProperties : properties;
    const lats = source.map((property) => property.lat);
    const lngs = source.map((property) => property.lng);

    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [properties, visibleProperties]);

  function fallbackPosition(property: Property) {
    const lngRange = fallbackBounds.maxLng - fallbackBounds.minLng || 1;
    const latRange = fallbackBounds.maxLat - fallbackBounds.minLat || 1;
    return {
      left: `${8 + ((property.lng - fallbackBounds.minLng) / lngRange) * 84}%`,
      top: `${8 + (1 - (property.lat - fallbackBounds.minLat) / latRange) * 84}%`,
    };
  }

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current || properties.length === 0) {
      return;
    }

    let cancelled = false;
    const token = mapboxToken;

    function createMap() {
      try {
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        setMapStatus("Initializing map...");
        mapboxgl.accessToken = token;
        const centerProperty = properties[0];
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [centerProperty.lng, centerProperty.lat],
          zoom: 13.4,
        });
        mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), "top-right");
        mapRef.current.on("load", () => {
          requestAnimationFrame(() => mapRef.current?.resize());
          setTimeout(() => mapRef.current?.resize(), 250);
          setMapStatus("Map loaded.");
        });
        mapRef.current.on("error", (event: mapboxgl.ErrorEvent) => {
          setMapStatus(event.error?.message ?? "Mapbox returned an error. Check token restrictions.");
          setShowFallbackMap(true);
        });
      } catch (mapError) {
        const message = mapError instanceof Error ? mapError.message : "Map could not be loaded.";
        setMapStatus(message);
        setError(message);
      }
    }

    createMap();

    return () => {
      cancelled = true;
      markerRef.current.forEach((marker) => marker.remove());
      markerRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, properties]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    markerRef.current.forEach((marker) => marker.remove());
    markerRef.current = visibleProperties.map((property) => {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className =
        "grid h-9 min-w-9 place-items-center rounded-full border-2 border-white bg-teal-700 px-2 text-xs font-bold text-white shadow-lg";
      markerElement.textContent = `$${Math.round(property.price / 1000)}k`;
      markerElement.setAttribute("aria-label", `Select ${property.address}`);
      markerElement.onclick = () => {
        setSelectedProperty(property);
        mapRef.current?.setCenter([property.lng, property.lat]);
        mapRef.current?.setZoom(14.5);
      };

      return new mapboxgl.Marker({ element: markerElement })
        .setLngLat([property.lng, property.lat])
        .addTo(mapRef.current!);
    });
  }, [visibleProperties]);

  async function submitShowingRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProperty) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const requestedTime = String(form.get("requestedTime") ?? "");
    setIsSubmitting(true);
    setRequestError("");
    setSuccess("");

    try {
      const response = await fetch("/api/buyer/showing-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: selectedProperty.id, requestedTime }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Showing request could not be sent.");
      }

      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl;
        return;
      }

      setIsModalOpen(false);
      setSuccess("Showing request created. Continue to checkout to alert agents.");
    } catch (submitError) {
      setRequestError(submitError instanceof Error ? submitError.message : "Showing request could not be sent.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-50 px-4 pb-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        <aside className="z-10 border-b border-slate-200 bg-white p-4 shadow-sm lg:border-b-0 lg:border-r">
          <div>
            <p className="text-sm font-semibold text-teal-700">Buyer dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold">Find a showing</h1>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Max price
                <input
                  type="number"
                  min="0"
                  value={filters.maxPrice}
                  onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
                  className="min-h-10 rounded-md border border-slate-300 px-3"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Minimum beds
                <input
                  type="number"
                  min="0"
                  value={filters.minBeds}
                  onChange={(event) => setFilters((current) => ({ ...current, minBeds: event.target.value }))}
                  className="min-h-10 rounded-md border border-slate-300 px-3"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Minimum baths
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.minBaths}
                  onChange={(event) => setFilters((current) => ({ ...current, minBaths: event.target.value }))}
                  className="min-h-10 rounded-md border border-slate-300 px-3"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Address, MLS, city, or ZIP
                <input
                  value={filters.location}
                  onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
                  className="min-h-10 rounded-md border border-slate-300 px-3"
                />
              </label>
            </div>
          </div>

          {success && <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
          {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="mt-5 max-h-[320px] space-y-3 overflow-auto pr-1">
            {isLoading && <p className="text-sm text-slate-600">Loading properties...</p>}
            {!isLoading && visibleProperties.length === 0 && <p className="text-sm text-slate-600">No active properties match these filters.</p>}
            {visibleProperties.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => {
                  setSelectedProperty(property);
                  mapRef.current?.setCenter([property.lng, property.lat]);
                  mapRef.current?.setZoom(14.5);
                }}
                className={`w-full rounded-md border p-3 text-left hover:bg-slate-50 ${
                  selectedProperty?.id === property.id ? "border-teal-500 ring-2 ring-teal-100" : "border-slate-200"
                }`}
              >
                <p className="font-semibold">{property.address}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {property.city}, {property.state} {property.zip}
                </p>
                <p className="mt-2 text-sm font-semibold">{currency.format(property.price)}</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="relative h-[560px] max-h-[calc(100vh-220px)] min-h-[420px]">
          {!mapboxToken && (
            <div className="absolute inset-4 z-10 grid place-items-center rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
              <div>
                <h2 className="text-lg font-semibold">Mapbox token required</h2>
                <p className="mt-2 max-w-md text-sm">
                  Add NEXT_PUBLIC_MAPBOX_TOKEN in Vercel and redeploy. Listings still load in the sidebar, but the interactive map needs that public token.
                </p>
              </div>
            </div>
          )}
          {mapboxToken && mapStatus !== "Map loaded." && (
            <div className="absolute left-4 top-4 z-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
              {mapStatus}
            </div>
          )}
          {mapboxToken && (
            <button
              type="button"
              onClick={() => setShowFallbackMap((current) => !current)}
              className="absolute right-4 top-4 z-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
            >
              {showFallbackMap ? "Show Mapbox map" : "Map blank? Show basic map"}
            </button>
          )}
          <div ref={mapContainerRef} className="absolute inset-0 bg-slate-200" />
          {showFallbackMap && (
            <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(15,118,110,0.08)_1px,transparent_1px),linear-gradient(rgba(15,118,110,0.08)_1px,transparent_1px)] bg-[size:48px_48px]">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50" />
              <div className="absolute left-4 top-4 rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                Basic map fallback
              </div>
              {visibleProperties.map((property) => (
                <button
                  key={property.id}
                  type="button"
                  style={fallbackPosition(property)}
                  onClick={() => setSelectedProperty(property)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white px-2 py-1 text-xs font-bold text-white shadow-lg ${
                    selectedProperty?.id === property.id ? "bg-teal-800 ring-4 ring-teal-200" : "bg-teal-700"
                  }`}
                >
                  ${Math.round(property.price / 1000)}k
                </button>
              ))}
            </div>
          )}

          {selectedProperty && (
            <div className="absolute inset-x-4 top-20 z-10 mx-auto max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl lg:left-auto lg:right-4 lg:top-16 lg:mx-0 lg:w-80">
              <button
                type="button"
                aria-label="Close property details"
                onClick={() => setSelectedProperty(null)}
                className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-white/95 text-lg font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
              >
                ×
              </button>
              {selectedProperty.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedProperty.imageUrl} alt={selectedProperty.address} className="h-32 w-full object-cover" />
              )}
              <div className="p-3">
                <p className="text-lg font-semibold">{currency.format(selectedProperty.price)}</p>
                <p className="mt-1 font-medium">{selectedProperty.address}</p>
                <p className="text-sm text-slate-600">
                  {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {selectedProperty.beds} beds - {selectedProperty.baths} baths
                </p>
                <button
                  onClick={() => {
                    setRequestError("");
                    setIsModalOpen(true);
                  }}
                  className="mt-3 min-h-10 w-full rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Request Showing
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {isModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-xl font-semibold">Request showing</h2>
            <p className="mt-2 text-sm text-slate-600">{selectedProperty.address}</p>
            {requestError && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{requestError}</p>}
            <form onSubmit={submitShowingRequest} className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Preferred showing time
                <input name="requestedTime" type="datetime-local" required className="min-h-11 rounded-md border border-slate-300 px-3" />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSubmitting ? "Starting checkout..." : "Continue to payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
