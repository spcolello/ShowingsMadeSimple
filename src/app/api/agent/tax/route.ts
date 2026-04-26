import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadAgentDocument } from "@/lib/agent-onboarding";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const form = await request.formData();
  const supabase = getSupabaseAdmin();
  const userId = (await cookies()).get("sms_user_id")?.value;
  const { data: profile } = supabase && userId
    ? await supabase.from("agent_profiles").select("id").eq("user_id", userId).maybeSingle()
    : { data: null };
  const agentId = profile?.id ?? String(form.get("agentId") ?? "pending-agent");
  const w9FileUrl = await uploadAgentDocument(agentId, form.get("w9File") as File | null, "w9");

  if (supabase && agentId !== "pending-agent") {
    await supabase.from("agent_profiles").update({
      w9_file_url: w9FileUrl,
      w9_verification_status: "pending_review",
    }).eq("id", agentId);

    if (w9FileUrl && userId) {
      await supabase.from("verification_documents").insert({
        owner_user_id: userId,
        document_type: "w9",
        storage_path: w9FileUrl,
        status: "pending_review",
      });
    }
  }

  return NextResponse.redirect(new URL("/agent/onboarding/payout", request.url), { status: 303 });
}
