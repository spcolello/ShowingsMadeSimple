import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyMatchingAgents } from "@/lib/workflow";

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!stripe || !env.stripeWebhookSecret || !signature) {
    return NextResponse.json({ received: true, mocked: true });
  }

  const event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const showingId = session.metadata?.showingId;
    if (showingId) {
      const supabase = getSupabaseAdmin();
      await supabase?.from("payments").insert({
        showing_request_id: showingId,
        stripe_checkout_session_id: session.id,
        amount_cents: session.amount_total,
        status: "paid",
      });
      await supabase
        ?.from("showing_requests")
        .update({ status: "paid", payment_status: "paid", payment_completed_at: new Date().toISOString() })
        .eq("id", showingId);
      await notifyMatchingAgents(showingId);
    }
  }

  return NextResponse.json({ received: true });
}
