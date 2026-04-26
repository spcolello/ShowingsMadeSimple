import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

  const userId = (await cookies()).get("sms_user_id")?.value;
  const supabase = getSupabaseAdmin();
  const { data: profile } = supabase && userId
    ? await supabase.from("buyer_profiles").select("id").eq("user_id", userId).maybeSingle()
    : { data: null };
  const ownerId = profile?.id ?? String(form.get("buyerId") ?? "pending-buyer");
  const documentOwnerId = userId && !userId.startsWith("mock-") ? userId : ownerId;
  const governmentIdUrl = await uploadBuyerDocument(ownerId, form.get("governmentId") as File | null, "government-id");
  const selfieUrl = await uploadBuyerDocument(ownerId, form.get("selfie") as File | null, "selfie");

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

    if (governmentIdUrl && userId) {
      await supabase.from("verification_documents").insert({
        owner_user_id: documentOwnerId,
        document_type: "government_id",
        storage_path: governmentIdUrl,
        status: "pending_review",
      });
    }
    if (selfieUrl && userId) {
      await supabase.from("verification_documents").insert({
        owner_user_id: documentOwnerId,
        document_type: "selfie",
        storage_path: selfieUrl,
        status: "pending_review",
      });
    }
  }

  return NextResponse.redirect(new URL("/buyer/onboarding/financial", request.url), { status: 303 });
}
