import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { holdShowingPayment } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const showingId = url.searchParams.get("showingId") ?? "local-new-showing";
  const stripe = getStripe();
  const origin = request.headers.get("origin") ?? url.origin;
  const supabase = getSupabaseAdmin();

  const { data: showing } = supabase
    ? await supabase
        .from("showing_requests")
        .select("id, property_address, showing_fee_cents")
        .eq("id", showingId)
        .maybeSingle()
    : { data: null };

  if (!stripe) {
    if (showing) {
      await holdShowingPayment({
        showingId: showing.id,
        checkoutSessionId: `mock_${crypto.randomUUID()}`,
        amountCents: showing.showing_fee_cents ?? 7500,
      });
    }
    return NextResponse.redirect(
      `${origin}/buyer/showings/${showing?.id ?? "demo-showing-1"}?mockCheckout=paid&showingId=${showingId}`,
      { status: 303 },
    );
  }

  const amountCents = showing?.showing_fee_cents ?? 7500;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      env.stripePriceId
        ? { price: env.stripePriceId, quantity: 1 }
        : {
            price_data: {
              currency: "usd",
              unit_amount: amountCents,
              product_data: {
                name: "Showing request fee",
                description: showing?.property_address ?? "Showings Made Simple",
              },
            },
            quantity: 1,
          },
    ],
    success_url: `${origin}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/buyer/dashboard?tab=request&payment=cancelled`,
    payment_intent_data: { metadata: { showingId } },
    metadata: { showingId },
  });

  if (showing && supabase) {
    await supabase.from("payments").upsert(
      {
        showing_request_id: showing.id,
        stripe_checkout_session_id: session.id,
        amount_cents: amountCents,
        status: "unpaid",
      },
      { onConflict: "showing_request_id" },
    );
  }

  return NextResponse.redirect(session.url!, { status: 303 });
}
