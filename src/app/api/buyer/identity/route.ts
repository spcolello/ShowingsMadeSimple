import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadBuyerDocument } from "@/lib/buyer-onboarding";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  street: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(5),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.safeParse(Object.fromEntries(form));

  if (!payload.success) {
    return NextResponse.redirect(new URL("/buyer/onboarding/identity?error=Invalid address", request.url), {
      status: 303,
    });
  }

  const ownerId = String(form.get("buyerId") ?? "pending-buyer");
  const governmentIdUrl = await uploadBuyerDocument(ownerId, form.get("governmentId") as File | null, "government-id");
  const selfieUrl = await uploadBuyerDocument(ownerId, form.get("selfie") as File | null, "selfie");
  const supabase = getSupabaseAdmin();

  if (supabase && ownerId !== "pending-buyer") {
    await supabase
      .from("buyer_profiles")
      .update({
        identity_verification_status: "pending_review",
        government_id_file_url: governmentIdUrl,
        selfie_file_url: selfieUrl,
        address: payload.data,
      })
      .eq("id", ownerId);
  }

  return NextResponse.redirect(new URL("/buyer/onboarding/financial", request.url), { status: 303 });
}
