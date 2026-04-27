import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell, Card, Section, StatusBadge } from "@/components/ui";
import { demoBuyer, demoShowings, formatMoney } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase";

type ShowingReview = {
  id: string;
  propertyAddress: string;
  propertyDetails: string;
  requestedTime: string;
  safetyNotes: string;
  attendees: number;
  status: string;
  payoutCents: number;
  buyerVerification: string;
  alreadyAssigned: boolean;
};

async function loadShowing(id: string): Promise<{ showing: ShowingReview; agentId: string }> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("sms_user_id")?.value;

  if (!userId) {
    redirect("/login?error=Agent login required.");
  }

  if (userId.startsWith("mock-")) {
    const showing = demoShowings.find((item) => item.id === id) ?? demoShowings[0];
    return {
      agentId: "agent-sam",
      showing: {
        id: showing.id,
        propertyAddress: showing.propertyAddress ?? showing.mlsNumber ?? "Demo property",
        propertyDetails: showing.propertySummary,
        requestedTime: showing.preferredTime,
        safetyNotes: showing.safetyNotes,
        attendees: showing.attendees,
        status: showing.status,
        payoutCents: showing.agentPayoutCents,
        buyerVerification: `${demoBuyer.identityVerificationStatus}/${demoBuyer.financialVerificationStatus}`,
        alreadyAssigned: Boolean(showing.assignedAgentId),
      },
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    redirect("/login?error=Supabase is not configured.");
  }

  const { data: agent } = await supabase
    .from("agent_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!agent) {
    redirect("/agent/onboarding");
  }

  const { data: showing } = await supabase
    .from("showing_requests")
    .select("*, buyer_profiles(identity_verification_status, financial_verification_status), properties(address, city, state, zip, price, beds, baths, mls_number)")
    .eq("id", id)
    .maybeSingle();

  if (!showing) {
    redirect("/agent/dashboard?error=showing_not_found");
  }

  const { data: assignment } = await supabase
    .from("showing_assignments")
    .select("agent_id")
    .eq("showing_request_id", id)
    .maybeSingle();

  const propertyAddress = showing.properties?.address
    ? `${showing.properties.address}, ${showing.properties.city ?? ""}, ${showing.properties.state ?? ""} ${showing.properties.zip ?? ""}`.trim()
    : showing.property_address ?? showing.mls_number ?? "Property details pending";
  const propertyDetails = [
    showing.properties?.mls_number ? `MLS ${showing.properties.mls_number}` : showing.mls_number ? `MLS ${showing.mls_number}` : null,
    showing.properties?.price ? formatMoney(Number(showing.properties.price) * 100) : null,
    showing.properties?.beds ? `${showing.properties.beds} beds` : null,
    showing.properties?.baths ? `${showing.properties.baths} baths` : null,
    showing.property_summary,
  ].filter(Boolean).join(" - ");

  return {
    agentId: agent.id,
    showing: {
      id: showing.id,
      propertyAddress,
      propertyDetails,
      requestedTime: showing.preferred_time,
      safetyNotes: showing.safety_notes ?? showing.notes ?? "No safety notes provided.",
      attendees: showing.attendees ?? 1,
      status: showing.status,
      payoutCents: showing.agent_payout_cents ?? 6000,
      buyerVerification: `${showing.buyer_profiles?.identity_verification_status ?? "unknown"}/${showing.buyer_profiles?.financial_verification_status ?? "unknown"}`,
      alreadyAssigned: Boolean(assignment),
    },
  };
}

export default async function AcceptShowingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claimed?: string; declined?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { showing, agentId } = await loadShowing(id);
  const alreadyClaimed = query.claimed === "true" || showing.alreadyAssigned;
  const declined = query.declined === "true";

  return (
    <AppShell>
      <Section className="max-w-2xl">
        <Card>
          <StatusBadge status={alreadyClaimed ? "already_claimed" : declined ? "declined" : "available"} />
          <h1 className="mt-4 text-2xl font-semibold">
            {alreadyClaimed ? "This showing has already been claimed." : "Review showing request"}
          </h1>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <p><span className="font-semibold">Property:</span> {showing.propertyAddress}</p>
            <p><span className="font-semibold">Details:</span> {showing.propertyDetails}</p>
            <p><span className="font-semibold">Requested time:</span> {new Date(showing.requestedTime).toLocaleString()}</p>
            <p><span className="font-semibold">Buyer verification:</span> {showing.buyerVerification}</p>
            <p><span className="font-semibold">Safety notes:</span> {showing.safetyNotes}</p>
            <p><span className="font-semibold">Attendees:</span> {showing.attendees}</p>
            <p><span className="font-semibold">Estimated payout:</span> {formatMoney(showing.payoutCents)}</p>
          </div>
          {!alreadyClaimed && (
            <div className="mt-6 flex flex-wrap gap-2">
              <form action="/api/showings/accept" method="post">
                <input type="hidden" name="showingId" value={showing.id} />
                <input type="hidden" name="agentId" value={agentId} />
                <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                  Accept showing
                </button>
              </form>
              <form action="/api/showings/decline" method="post">
                <input type="hidden" name="showingId" value={showing.id} />
                <input type="hidden" name="agentId" value={agentId} />
                <input type="hidden" name="returnTo" value={`/agent/accept/${showing.id}?declined=true`} />
                <button className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100">
                  Decline
                </button>
              </form>
            </div>
          )}
        </Card>
      </Section>
    </AppShell>
  );
}
