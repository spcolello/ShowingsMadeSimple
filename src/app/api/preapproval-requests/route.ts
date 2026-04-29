import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  propertyId: z.string().uuid(),
  lenderId: z.string().uuid(),
  propertyAddress: z.string().min(1),
  propertyCity: z.string().min(1),
  propertyState: z.string().min(2),
  propertyZip: z.string().min(5),
  targetPurchasePrice: z.coerce.number().positive().optional(),
  buyerIncomeRange: z.string().min(1),
  buyerCreditRange: z.string().min(1),
  buyerDownPaymentRange: z.string().min(1),
  buyerTimeline: z.string().min(1),
  buyerPhone: z.string().min(7),
  buyerEmail: z.string().email(),
  consentToContact: z.literal(true),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("sms_user_id")?.value;
  const role = cookieStore.get("sms_demo_role")?.value;

  if (!userId || role !== "buyer") {
    return NextResponse.json({ error: "Buyer login required." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Complete all required pre-approval fields and consent to contact." }, { status: 400 });
  }

  if (userId.startsWith("mock-")) {
    return NextResponse.json({
      message: "Your request was sent to the lender. They should contact you soon.",
      request: { id: crypto.randomUUID(), status: "new" },
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const [{ data: buyer }, { data: lender }, { data: property }] = await Promise.all([
    supabase.from("buyer_profiles").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("lenders").select("*").eq("id", parsed.data.lenderId).maybeSingle(),
    supabase.from("properties").select("id, state, zip").eq("id", parsed.data.propertyId).maybeSingle(),
  ]);

  if (!buyer) {
    return NextResponse.json({ error: "Buyer profile was not found." }, { status: 404 });
  }

  if (!lender || lender.is_active !== true) {
    return NextResponse.json({ error: "Lender is not available." }, { status: 404 });
  }

  const propertyState = (property?.state ?? parsed.data.propertyState).toUpperCase();
  const licensedStates = (lender.licensed_states ?? []).map((state: string) => state.toUpperCase());
  if (!licensedStates.includes(propertyState)) {
    return NextResponse.json({ error: "This lender is not licensed for the property state." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("preapproval_requests")
    .insert({
      buyer_id: buyer.id,
      property_id: parsed.data.propertyId,
      lender_id: parsed.data.lenderId,
      property_address: parsed.data.propertyAddress,
      property_city: parsed.data.propertyCity,
      property_state: propertyState,
      property_zip: property?.zip ?? parsed.data.propertyZip,
      target_purchase_price: parsed.data.targetPurchasePrice,
      buyer_income_range: parsed.data.buyerIncomeRange,
      buyer_credit_range: parsed.data.buyerCreditRange,
      buyer_down_payment_range: parsed.data.buyerDownPaymentRange,
      buyer_timeline: parsed.data.buyerTimeline,
      buyer_phone: parsed.data.buyerPhone,
      buyer_email: parsed.data.buyerEmail,
      consent_to_contact: parsed.data.consentToContact,
      status: "new",
    })
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    action: "preapproval_request_created",
    subject_id: data.id,
    note: `Lead submitted to ${lender.company_name}`,
  });

  return NextResponse.json({
    message: `Your request was sent to ${lender.company_name}. They should contact you soon.`,
    request: data,
  });
}
