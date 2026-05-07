import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { mapProperty, type PropertyRow } from "@/lib/property-types";
import { getSupabaseAdmin } from "@/lib/supabase";

type LocalProperty = {
  address: string;
  city: string;
  state: string;
  zip: string;
  mls_number: string | null;
  price: number;
  beds: number;
  baths: number;
  lat: number;
  lng: number;
  image_url: string | null;
  listing_url: string | null;
  status: string;
};

export async function GET() {
  const role = (await cookies()).get("sms_demo_role")?.value;
  if (!role) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ properties: await loadLocalProperties() });
  }

  let result:
    | { data: PropertyRow[] | null; error: { message: string } | null }
    | null = null;

  try {
    result = await supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .order("price", { ascending: true })
      .returns<PropertyRow[]>();
  } catch (fetchError) {
    console.error("Supabase properties fetch threw. Falling back to local MVP properties.", fetchError);
    return NextResponse.json({ properties: await loadLocalProperties() });
  }

  const { data, error } = result;

  if (error) {
    console.error("Supabase properties fetch failed. Falling back to local MVP properties.", error);
    return NextResponse.json({ properties: await loadLocalProperties() });
  }

  return NextResponse.json({ properties: (data ?? []).map(mapProperty) });
}

async function loadLocalProperties() {
  const filePath = path.join(process.cwd(), "data", "mvp-properties.json");
  const json = await readFile(filePath, "utf8");
  const rows = JSON.parse(json) as LocalProperty[];

  return rows
    .filter((property) => property.status === "active")
    .sort((a, b) => a.price - b.price)
    .map((property) =>
      mapProperty({
        id: property.mls_number ?? property.listing_url ?? `${property.address}-${property.zip}`,
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip,
        mls_number: property.mls_number,
        price: property.price,
        beds: property.beds,
        baths: property.baths,
        lat: property.lat,
        lng: property.lng,
        image_url: property.image_url,
        listing_url: property.listing_url,
        status: property.status,
      }),
    );
}
