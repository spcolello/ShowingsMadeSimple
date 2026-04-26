import { NextResponse } from "next/server";
import { uploadAgentDocument } from "@/lib/agent-onboarding";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const form = await request.formData();
  const agentId = String(form.get("agentId") ?? "pending-agent");
  const w9FileUrl = await uploadAgentDocument(agentId, form.get("w9File") as File | null, "w9");
  const supabase = getSupabaseAdmin();

  if (supabase && agentId !== "pending-agent") {
    await supabase.from("agent_profiles").update({
      w9_file_url: w9FileUrl,
      w9_verification_status: "pending_review",
    }).eq("id", agentId);
  }

  return NextResponse.redirect(new URL("/agent/onboarding/payout", request.url), { status: 303 });
}
