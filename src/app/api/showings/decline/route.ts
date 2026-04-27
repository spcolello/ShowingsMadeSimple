import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const form = await request.formData();
  const showingId = String(form.get("showingId"));
  const agentId = String(form.get("agentId"));
  const returnTo = String(form.get("returnTo") ?? "/agent/dashboard?declined=true");
  const supabase = getSupabaseAdmin();

  if (supabase) {
    await supabase.from("audit_logs").insert({
      action: "agent_declined_showing",
      subject_id: showingId,
      note: agentId,
    });
  }

  return NextResponse.redirect(new URL(returnTo.startsWith("/") ? returnTo : "/agent/dashboard?declined=true", request.url), { status: 303 });
}
