import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createShowingRequest } from "@/lib/workflow";

const schema = z.object({
  propertyId: z.string().uuid(),
  requestedTime: z.string().min(1),
});

export async function POST(request: Request) {
  const userId = (await cookies()).get("sms_user_id")?.value;
  const role = (await cookies()).get("sms_demo_role")?.value;

  if (!userId || role !== "buyer") {
    return NextResponse.json({ error: "Buyer login required." }, { status: 401 });
  }

  const payload = schema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Enter a valid property and requested time." }, { status: 400 });
  }

  if (userId.startsWith("mock-")) {
    return NextResponse.json({
      checkoutUrl: "/api/stripe/checkout?showingId=local-new-showing",
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const [{ data: buyer }, { data: property, error: propertyError }] = await Promise.all([
    supabase.from("buyer_profiles").select("id").eq("user_id", userId).maybeSingle(),
    supabase
      .from("properties")
      .select("id, address, city, state, zip, price, beds, baths, mls_number")
      .eq("id", payload.data.propertyId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (!buyer) {
    return NextResponse.json({ error: "Buyer profile was not found." }, { status: 404 });
  }

  if (propertyError || !property) {
    return NextResponse.json({ error: "Property was not found." }, { status: 404 });
  }

  const requestedTime = new Date(payload.data.requestedTime);
  if (Number.isNaN(requestedTime.getTime())) {
    return NextResponse.json({ error: "Enter a valid requested time." }, { status: 400 });
  }

  try {
    const showing = await createShowingRequest({
      buyerId: buyer.id,
      propertyAddress: property.address,
      mlsNumber: property.mls_number ?? undefined,
      propertySummary: [
        property.mls_number ? `MLS ${property.mls_number}` : null,
        property.price ? `$${Number(property.price).toLocaleString()}` : null,
        property.beds ? `${property.beds} beds` : null,
        property.baths ? `${property.baths} baths` : null,
      ]
        .filter(Boolean)
        .join(" - "),
      zipCode: property.zip,
      preferredTime: requestedTime.toISOString(),
      attendees: 1,
      seriousInterest: true,
    });

    await supabase
      .from("showing_requests")
      .update({
        property_id: property.id,
        requested_time: requestedTime.toISOString(),
      })
      .eq("id", showing.id);

    return NextResponse.json({
      checkoutUrl: `/api/stripe/checkout?showingId=${showing.id}`,
      showingRequest: {
        id: showing.id,
        propertyId: property.id,
        requestedTime: requestedTime.toISOString(),
        status: showing.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Showing request could not be created." },
      { status: 400 },
    );
  }
}
