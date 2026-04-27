import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

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
      showingRequest: {
        id: crypto.randomUUID(),
        propertyId: payload.data.propertyId,
        requestedTime: payload.data.requestedTime,
        status: "pending",
      },
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
      .select("id, address, zip")
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

  const { data, error } = await supabase
    .from("showing_requests")
    .insert({
      buyer_id: buyer.id,
      property_id: property.id,
      property_address: property.address,
      zip_code: property.zip,
      preferred_time: requestedTime.toISOString(),
      requested_time: requestedTime.toISOString(),
      status: "pending",
      payment_status: "unpaid",
      attendees: 1,
      serious_interest_confirmed: true,
    })
    .select("id, property_id, requested_time, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    showingRequest: {
      id: data.id,
      propertyId: data.property_id,
      requestedTime: data.requested_time,
      status: data.status,
    },
  });
}
