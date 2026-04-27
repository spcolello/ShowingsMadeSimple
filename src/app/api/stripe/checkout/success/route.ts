import { NextResponse } from "next/server";
import { holdShowingPayment, stripeId } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin") ?? url.origin;
  const sessionId = url.searchParams.get("session_id");
  const stripe = getStripe();

  if (!stripe || !sessionId) {
    return NextResponse.redirect(`${origin}/buyer/dashboard?payment=failed`, { status: 303 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const showingId = session.metadata?.showingId;

  if (!showingId || session.payment_status !== "paid") {
    return NextResponse.redirect(`${origin}/buyer/dashboard?payment=failed`, { status: 303 });
  }

  await holdShowingPayment({
    showingId,
    checkoutSessionId: session.id,
    paymentIntentId: stripeId(session.payment_intent),
    amountCents: session.amount_total,
  });

  return NextResponse.redirect(`${origin}/buyer/showings/${showingId}?payment=success`, { status: 303 });
}
