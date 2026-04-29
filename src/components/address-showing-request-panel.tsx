import { Card, Field, StatusBadge } from "@/components/ui";
import { addressShowingStatusText, type AddressShowingStatus } from "@/lib/address-showings";

export type BuyerAddressShowingRequest = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  preferredTime: string;
  status: AddressShowingStatus;
  assignedAgentName?: string | null;
};

export function AddressShowingRequestPanel({
  requests,
  error,
  created,
}: {
  requests: BuyerAddressShowingRequest[];
  error?: string;
  created?: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <h1 className="text-2xl font-semibold">Request a Showing by Address</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter any property address. An assigned agent will manually check MLS availability before the showing is confirmed.
        </p>
        {created === "true" && (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Request submitted. We are looking for an agent in that area.
          </p>
        )}
        {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form action="/api/address-showings" method="post" className="mt-6 grid gap-4">
          <Field label="Property address" name="address" placeholder="42 Market St, Amsterdam, NY 12010" />
          <Field label="Preferred date/time" name="preferredTime" type="datetime-local" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Buyer name" name="buyerName" />
            <Field label="Buyer phone" name="buyerPhone" type="tel" />
            <Field label="Buyer email" name="buyerEmail" type="email" />
          </div>
          <label className="flex gap-3 text-sm text-slate-700">
            <input type="checkbox" name="preapproved" value="true" className="mt-1" />
            I am already pre-approved or financially prepared.
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Notes
            <textarea name="notes" rows={3} className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
            Request agent
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Address request status</h2>
        <div className="mt-4 grid gap-3">
          {requests.length === 0 && <p className="text-sm text-slate-600">No address-based showing requests yet.</p>}
          {requests.map((request) => (
            <div key={request.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.address}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {request.city}, {request.state} {request.zip}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{new Date(request.preferredTime).toLocaleString()}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <p className="mt-3 text-sm text-slate-700">{addressShowingStatusText[request.status]}</p>
              {request.assignedAgentName && <p className="mt-1 text-sm text-slate-600">Agent: {request.assignedAgentName}</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
