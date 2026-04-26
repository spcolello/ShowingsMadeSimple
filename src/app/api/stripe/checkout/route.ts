import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const showingId = url.searchParams.get("showingId") ?? "local-new-showing";
  const stripe = getStripe();

  if (!stripe || !env.stripePriceId) {
    return NextResponse.redirect(
      `${env.appUrl}/buyer/showings/demo-showing-1?mockCheckout=paid&showingId=${showingId}`,
      { status: 303 },
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: env.stripePriceId, quantity: 1 }],
    success_url: `${env.appUrl}/buyer/showings/${showingId}?payment=success`,
    cancel_url: `${env.appUrl}/buyer/showings/new?payment=cancelled`,
    metadata: { showingId },
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
