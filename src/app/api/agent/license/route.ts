import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadAgentDocument } from "@/lib/agent-onboarding";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  licenseNumber: z.string().min(2),
  licenseState: z.string().min(2),
  licenseExpirationDate: z.string().min(4),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));
  if (!payload.success) {
    return NextResponse.redirect(new URL("/agent/onboarding/license?error=Invalid license information", request.url), { status: 303 });
  }

  const agentId = String(form.get("agentId") ?? "pending-agent");
  const licenseFileUrl = await uploadAgentDocument(agentId, form.get("licenseFile") as File | null, "license");
  const supabase = getSupabaseAdmin();

  if (supabase && agentId !== "pending-agent") {
    await supabase.from("agent_profiles").update({
      license_number: payload.data.licenseNumber,
      license_state: payload.data.licenseState,
      license_expiration_date: payload.data.licenseExpirationDate,
      license_file_url: licenseFileUrl,
      license_verification_status: "pending_review",
    }).eq("id", agentId);
  }

  return NextResponse.redirect(new URL("/agent/onboarding/brokerage", request.url), { status: 303 });
}
