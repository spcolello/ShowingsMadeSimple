import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mapProperty, type PropertyRow } from "@/lib/property-types";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const role = (await cookies()).get("sms_demo_role")?.value;
  if (!role) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "active")
    .order("price", { ascending: true })
    .returns<PropertyRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ properties: (data ?? []).map(mapProperty) });
}
