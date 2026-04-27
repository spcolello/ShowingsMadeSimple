import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { holdShowingPayment, stripeId } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!stripe || !env.stripeWebhookSecret || !signature) {
    return NextResponse.json({ received: true, mocked: true });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const showingId = session.metadata?.showingId;
    if (showingId) {
      await holdShowingPayment({
        showingId,
        checkoutSessionId: session.id,
        paymentIntentId: stripeId(session.payment_intent),
        amountCents: session.amount_total,
      });
    }
  }

  return NextResponse.json({ received: true });
}
