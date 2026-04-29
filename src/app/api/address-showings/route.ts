import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findMatchingAddressAgents, notifyAddressShowingAgents } from "@/lib/address-showings";
import { geocodeAddress } from "@/lib/geocoding";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  address: z.string().min(5),
  preferredTime: z.string().min(1),
  buyerName: z.string().min(2),
  buyerPhone: z.string().min(7),
  buyerEmail: z.string().email(),
  preapproved: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = (await cookies()).get("sms_user_id")?.value;
  const role = (await cookies()).get("sms_demo_role")?.value;

  if (!userId || role !== "buyer") {
    return NextResponse.redirect(new URL("/login?error=Buyer login required.", request.url), { status: 303 });
  }

  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/buyer/dashboard?tab=address&error=Enter a valid address, time, and contact information.", request.url), { status: 303 });
  }

  if (userId.startsWith("mock-")) {
    return NextResponse.redirect(new URL("/buyer/dashboard?tab=address&created=true", request.url), { status: 303 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.redirect(new URL("/buyer/dashboard?tab=address&error=Supabase is not configured.", request.url), { status: 303 });
  }

  const geocoded = await geocodeAddress(parsed.data.address);
  const preferredTime = new Date(parsed.data.preferredTime);
  if (Number.isNaN(preferredTime.getTime())) {
    return NextResponse.redirect(new URL("/buyer/dashboard?tab=address&error=Enter a valid preferred time.", request.url), { status: 303 });
  }

  const { data: created, error } = await supabase
    .from("address_showing_requests")
    .insert({
      buyer_user_id: userId,
      address: geocoded.address,
      city: geocoded.city,
      state: geocoded.state,
      zip: geocoded.zip,
      lat: geocoded.lat,
      lng: geocoded.lng,
      preferred_time: preferredTime.toISOString(),
      buyer_name: parsed.data.buyerName,
      buyer_phone: parsed.data.buyerPhone,
      buyer_email: parsed.data.buyerEmail,
      preapproved: parsed.data.preapproved === "true",
      notes: parsed.data.notes,
      status: "pending_agent",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.redirect(new URL(`/buyer/dashboard?tab=address&error=${encodeURIComponent(error.message)}`, request.url), { status: 303 });
  }

  const { data: agents } = await supabase
    .from("agent_profiles")
    .select("id, name, phone, service_zips, service_areas, service_radius_miles, home_lat, home_lng, is_active, is_available, users(email)")
    .eq("approval_status", "approved");
  const matchedAgents = findMatchingAddressAgents(agents ?? [], geocoded);

  if (matchedAgents.length === 0) {
    await supabase.from("address_showing_requests").update({ status: "no_agents_found", updated_at: new Date().toISOString() }).eq("id", created.id);
    await supabase.from("audit_logs").insert({
      action: "address_showing_no_agents_found",
      subject_id: created.id,
      note: `${geocoded.address}, ${geocoded.city}, ${geocoded.state} ${geocoded.zip}`,
    });
  } else {
    await notifyAddressShowingAgents(created.id, geocoded.address, preferredTime.toISOString(), matchedAgents.map((agent) => agent.id));
  }

  return NextResponse.redirect(new URL("/buyer/dashboard?tab=address&created=true", request.url), { status: 303 });
}
