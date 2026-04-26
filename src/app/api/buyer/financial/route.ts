import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { uploadBuyerDocument } from "@/lib/buyer-onboarding";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  method: z.enum(["soft_credit_check", "prequalification_letter"]),
});

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = schema.parse(Object.fromEntries(form));
  const supabase = getSupabaseAdmin();
  const userId = (await cookies()).get("sms_user_id")?.value;
  const { data: profile } = supabase && userId
    ? await supabase.from("buyer_profiles").select("id").eq("user_id", userId).maybeSingle()
    : { data: null };
  const ownerId = profile?.id ?? String(form.get("buyerId") ?? "pending-buyer");

  if (payload.method === "soft_credit_check") {
    const consent = form.get("softCreditCheckConsent") === "true";
    if (!consent) {
      return NextResponse.redirect(
        new URL("/buyer/onboarding/financial?error=Soft credit consent is required", request.url),
        { status: 303 },
      );
    }

    if (supabase && ownerId !== "pending-buyer") {
      await supabase
        .from("buyer_profiles")
        .update({
          financial_verification_status: "pending_review",
          soft_credit_check_consent: true,
        })
        .eq("id", ownerId);
    }
  }

  if (payload.method === "prequalification_letter") {
    const url = await uploadBuyerDocument(
      ownerId,
      form.get("prequalificationLetter") as File | null,
      "prequalification-letter",
    );

    if (supabase && ownerId !== "pending-buyer") {
      await supabase
        .from("buyer_profiles")
        .update({
          financial_verification_status: "pending_review",
          prequalification_letter_url: url,
        })
        .eq("id", ownerId);

      if (url && userId) {
        await supabase.from("verification_documents").insert({
          owner_user_id: userId,
          document_type: "prequalification_letter",
          storage_path: url,
          status: "pending_review",
        });
      }
    }
  }

  return NextResponse.redirect(new URL("/buyer/onboarding/complete", request.url), { status: 303 });
}
