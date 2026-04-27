import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { demoAgents, demoShowings } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase";

type ShowingRow = {
  id: string;
  buyer_id: string;
  property_address: string | null;
  mls_number: string | null;
  zip_code: string | null;
  preferred_time: string;
  status: string;
  payment_status: string;
  showing_fee_cents: number;
  requested_at: string;
};

type AssignmentRow = {
  showing_request_id: string;
  agent_id: string;
};

type AgentRow = {
  id: string;
  name: string | null;
};

function normalizeShowingStatus(status: string) {
  if (status === "assigned") return "agent_assigned";
  if (status === "draft" || status === "payment_pending" || status === "paid" || status === "searching_for_agent") {
    return "pending";
  }
  return status;
}

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("sms_user_id")?.value;
  const role = cookieStore.get("sms_demo_role")?.value;

  if (!userId || role !== "buyer") {
    return NextResponse.json({ error: "Buyer login required." }, { status: 401 });
  }

  if (userId.startsWith("mock-")) {
    return NextResponse.json({
      showings: demoShowings.map((showing) => ({
        id: showing.id,
        propertyAddress: showing.propertyAddress,
        mlsNumber: showing.mlsNumber,
        zipCode: showing.zipCode,
        preferredTime: showing.preferredTime,
        status: showing.status,
        paymentStatus: showing.paymentStatus,
        showingFeeCents: showing.showingFeeCents,
        assignedAgentId: showing.assignedAgentId,
        agentName: demoAgents.find((agent) => agent.id === showing.assignedAgentId)?.name ?? null,
      })),
      updatedAt: new Date().toISOString(),
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data: buyer } = await supabase
    .from("buyer_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!buyer) {
    return NextResponse.json({ error: "Buyer profile was not found." }, { status: 404 });
  }

  const { data: rawShowings, error } = await supabase
    .from("showing_requests")
    .select("id, buyer_id, property_address, mls_number, zip_code, preferred_time, status, payment_status, showing_fee_cents, requested_at")
    .eq("buyer_id", buyer.id)
    .order("requested_at", { ascending: false })
    .returns<ShowingRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const showings = rawShowings ?? [];
  const showingIds = showings.map((showing) => showing.id);
  const { data: rawAssignments } = showingIds.length
    ? await supabase
        .from("showing_assignments")
        .select("showing_request_id, agent_id")
        .in("showing_request_id", showingIds)
        .returns<AssignmentRow[]>()
    : { data: [] as AssignmentRow[] };
  const assignments = rawAssignments ?? [];

  const agentIds = [...new Set(assignments.map((assignment) => assignment.agent_id))];
  const { data: rawAgents } = agentIds.length
    ? await supabase.from("agent_profiles").select("id, name").in("id", agentIds).returns<AgentRow[]>()
    : { data: [] as AgentRow[] };
  const agentsById = new Map((rawAgents ?? []).map((agent) => [agent.id, agent.name ?? "Assigned agent"]));

  return NextResponse.json({
    showings: showings.map((showing) => {
      const assignment = assignments.find((item) => item.showing_request_id === showing.id);
      return {
        id: showing.id,
        propertyAddress: showing.property_address,
        mlsNumber: showing.mls_number,
        zipCode: showing.zip_code,
        preferredTime: showing.preferred_time,
        status: normalizeShowingStatus(showing.status),
        paymentStatus: showing.payment_status,
        showingFeeCents: showing.showing_fee_cents,
        assignedAgentId: assignment?.agent_id ?? null,
        agentName: assignment?.agent_id ? agentsById.get(assignment.agent_id) ?? "Assigned agent" : null,
      };
    }),
    updatedAt: new Date().toISOString(),
  });
}
