import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  (await import("node:fs")).readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const properties = [
  ["88 SW 7th St Unit 2101", "Miami", "FL", "33130", 685000, 2, 2, 25.76618, -80.19486, "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/88-sw-7th-2101"],
  ["1300 Brickell Bay Dr Apt 2204", "Miami", "FL", "33131", 815000, 2, 2.5, 25.76081, -80.19029, "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/1300-brickell-bay-2204"],
  ["1010 Brickell Ave Unit 3908", "Miami", "FL", "33131", 925000, 3, 3, 25.76448, -80.19204, "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/1010-brickell-3908"],
  ["45 SW 9th St Apt 3706", "Miami", "FL", "33130", 735000, 2, 2, 25.76504, -80.19411, "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/45-sw-9th-3706"],
  ["801 S Miami Ave Unit 4602", "Miami", "FL", "33130", 1195000, 3, 3.5, 25.76591, -80.19302, "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/801-s-miami-4602"],
  ["55 SW 9th St Apt 3001", "Miami", "FL", "33130", 640000, 1, 1.5, 25.76502, -80.19485, "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/55-sw-9th-3001"],
  ["1451 Brickell Ave Apt 1803", "Miami", "FL", "33131", 1495000, 3, 3.5, 25.75896, -80.19123, "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/1451-brickell-1803"],
  ["60 SW 13th St Apt 2416", "Miami", "FL", "33130", 575000, 1, 1, 25.76169, -80.19372, "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/60-sw-13th-2416"],
  ["200 Biscayne Blvd Way Apt 4308", "Miami", "FL", "33131", 1325000, 2, 2.5, 25.77137, -80.18982, "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/200-biscayne-4308"],
  ["485 Brickell Ave Apt 3507", "Miami", "FL", "33131", 795000, 2, 2, 25.76873, -80.18966, "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80", "https://example.com/listings/485-brickell-3507"],
].map(([address, city, state, zip, price, beds, baths, lat, lng, image_url, listing_url], index) => ({
  address,
  city,
  state,
  zip,
  mls_number: `A115501${String(index + 1).padStart(2, "0")}`,
  price,
  beds,
  baths,
  lat,
  lng,
  image_url,
  listing_url,
  status: "active",
}));

const { error } = await supabase.from("properties").upsert(properties, { onConflict: "listing_url" });

if (error) {
  throw error;
}

console.log(`Seeded ${properties.length} properties.`);
