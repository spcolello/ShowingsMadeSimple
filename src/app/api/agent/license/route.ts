import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

  const supabase = getSupabaseAdmin();
  const userId = (await cookies()).get("sms_user_id")?.value;
  const { data: profile } = supabase && userId
    ? await supabase.from("agent_profiles").select("id").eq("user_id", userId).maybeSingle()
    : { data: null };
  const agentId = profile?.id ?? String(form.get("agentId") ?? "pending-agent");
  const licenseFileUrl = await uploadAgentDocument(agentId, form.get("licenseFile") as File | null, "license");

  if (supabase && agentId !== "pending-agent") {
    await supabase.from("agent_profiles").update({
      license_number: payload.data.licenseNumber,
      license_state: payload.data.licenseState,
      license_expiration_date: payload.data.licenseExpirationDate,
      license_file_url: licenseFileUrl,
      license_verification_status: "pending_review",
    }).eq("id", agentId);

    if (licenseFileUrl && userId) {
      await supabase.from("verification_documents").insert({
        owner_user_id: userId,
        document_type: "agent_license",
        storage_path: licenseFileUrl,
        status: "pending_review",
      });
    }
  }

  return NextResponse.redirect(new URL("/agent/onboarding/brokerage", request.url), { status: 303 });
}
