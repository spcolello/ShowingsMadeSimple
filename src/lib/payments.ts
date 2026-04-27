import type Stripe from "stripe";
import { notifyMatchingAgents } from "./workflow";
import { getSupabaseAdmin } from "./supabase";

type ShowingPaymentInput = {
  showingId: string;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  amountCents?: number | null;
};

export async function holdShowingPayment(input: ShowingPaymentInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { held: false, notified: false };
  }

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("status")
    .eq("showing_request_id", input.showingId)
    .maybeSingle();
  const wasAlreadyHeld = existingPayment?.status === "held" || existingPayment?.status === "released";

  const { data: showing, error: showingError } = await supabase
    .from("showing_requests")
    .select("showing_fee_cents")
    .eq("id", input.showingId)
    .maybeSingle();

  if (showingError) {
    throw showingError;
  }

  await supabase.from("payments").upsert(
    {
      showing_request_id: input.showingId,
      stripe_checkout_session_id: input.checkoutSessionId,
      stripe_payment_intent_id: input.paymentIntentId,
      amount_cents: input.amountCents ?? showing?.showing_fee_cents ?? 7500,
      status: "held",
    },
    { onConflict: "showing_request_id" },
  );

  const now = new Date().toISOString();
  await supabase
    .from("showing_requests")
    .update({ status: "pending", payment_status: "held", payment_completed_at: now })
    .eq("id", input.showingId);

  if (!wasAlreadyHeld) {
    await notifyMatchingAgents(input.showingId);
  }

  return { held: true, notified: !wasAlreadyHeld };
}

export function stripeId(value: Stripe.Checkout.Session["payment_intent"]) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
