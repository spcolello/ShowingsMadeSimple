import { AppShell, ButtonLink, Card, Section, StatusBadge } from "@/components/ui";
import { demoAgents, demoShowings, formatMoney, matchingAgentsForZip } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function ShowingDetailPage({
  searchParams,
  params,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; mockCheckout?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = getSupabaseAdmin();

  if (supabase && id !== "demo-showing-1" && id !== "local-new-showing") {
    const { data: showing } = await supabase
      .from("showing_requests")
      .select("id, property_address, mls_number, property_summary, zip_code, preferred_time, attendees, safety_notes, notes, status, payment_status, showing_fee_cents")
      .eq("id", id)
      .maybeSingle();

    if (showing) {
      const [{ data: assignment }, { data: payment }] = await Promise.all([
        supabase
          .from("showing_assignments")
          .select("agent_id, agent_profiles(name, phone)")
          .eq("showing_request_id", id)
          .maybeSingle(),
        supabase
          .from("payments")
          .select("status, amount_cents")
          .eq("showing_request_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const assignedAgent = Array.isArray(assignment?.agent_profiles)
        ? assignment?.agent_profiles[0]
        : assignment?.agent_profiles;

      return (
        <AppShell>
          <Section className="max-w-4xl">
            {query.payment === "success" && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                Payment received. Nearby agents can now accept this showing.
              </p>
            )}
            {query.mockCheckout === "paid" && (
              <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                Demo payment completed. Agents are now eligible to accept.
              </p>
            )}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-teal-700">Showing detail</p>
                <h1 className="mt-1 text-3xl font-semibold">{showing.property_address ?? showing.mls_number}</h1>
              </div>
              <StatusBadge status={showing.status} />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card>
                <h2 className="font-semibold">Request</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Preferred time</dt>
                    <dd>{new Date(showing.preferred_time).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Attendees</dt>
                    <dd>{showing.attendees}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Property details</dt>
                    <dd>{showing.property_summary ?? "Buyer-selected property"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Notes</dt>
                    <dd>{showing.safety_notes ?? showing.notes ?? "No notes added."}</dd>
                  </div>
                </dl>
              </Card>
              <Card>
                <h2 className="font-semibold">Payment and assignment</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Payment</dt>
                    <dd>
                      {payment?.status ?? showing.payment_status} - {formatMoney(payment?.amount_cents ?? showing.showing_fee_cents)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Assigned agent</dt>
                    <dd>{assignedAgent?.name ?? "Waiting for first accept"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Next step</dt>
                    <dd>{showing.payment_status === "held" ? "Nearby approved agents can accept this request." : "Complete payment to alert agents."}</dd>
                  </div>
                </dl>
              </Card>
            </div>
            <div className="mt-6">
              <ButtonLink href="/buyer/dashboard" variant="secondary">
                Back to dashboard
              </ButtonLink>
            </div>
          </Section>
        </AppShell>
      );
    }
  }

  const showing = demoShowings.find((item) => item.id === id) ?? demoShowings[0];
  const agent = demoAgents.find((item) => item.id === showing.assignedAgentId);
  const matches = matchingAgentsForZip(showing.zipCode);

  return (
    <AppShell>
      <Section className="max-w-4xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-teal-700">Showing detail</p>
            <h1 className="mt-1 text-3xl font-semibold">{showing.propertyAddress}</h1>
          </div>
          <StatusBadge status={showing.status} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Request</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Preferred time</dt>
                <dd>{new Date(showing.preferredTime).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Attendees</dt>
                <dd>{showing.attendees}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Notes</dt>
                <dd>{showing.safetyNotes}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h2 className="font-semibold">Payment and assignment</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Payment</dt>
                <dd>
                  {showing.paymentStatus} - {formatMoney(showing.showingFeeCents)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Assigned agent</dt>
                <dd>{agent?.name ?? "Waiting for first accept"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Agents notified</dt>
                <dd>{matches.map((match) => match.name).join(", ") || "None yet"}</dd>
              </div>
            </dl>
          </Card>
        </div>
        <div className="mt-6">
          <ButtonLink href="/buyer/dashboard" variant="secondary">
            Back to dashboard
          </ButtonLink>
        </div>
      </Section>
    </AppShell>
  );
}
