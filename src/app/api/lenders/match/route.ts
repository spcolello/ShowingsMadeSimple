import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getMatchedLendersForProperty, mapLender, type LenderRow } from "@/lib/lenders";
import { mapProperty, type PropertyRow } from "@/lib/property-types";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const role = (await cookies()).get("sms_demo_role")?.value;
  if (!role) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const propertyId = url.searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json({ error: "Property is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const [{ data: property, error: propertyError }, { data: lenderRows, error: lenderError }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", propertyId).maybeSingle<PropertyRow>(),
    supabase.from("lenders").select("*").eq("is_active", true).returns<LenderRow[]>(),
  ]);

  if (propertyError || !property) {
    return NextResponse.json({ error: "Property was not found." }, { status: 404 });
  }

  if (lenderError) {
    return NextResponse.json({ error: lenderError.message }, { status: 500 });
  }

  const matched = getMatchedLendersForProperty(mapProperty(property), (lenderRows ?? []).map(mapLender)).slice(0, 3);
  return NextResponse.json({ lenders: matched });
}
