import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
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

const properties = JSON.parse(readFileSync("data/mvp-properties.json", "utf8")).map((property) => {
  const insertableProperty = { ...property };
  delete insertableProperty.source_status;
  return insertableProperty;
});

const { error: deleteError } = await supabase.from("properties").delete().neq("id", "00000000-0000-0000-0000-000000000000");

if (deleteError) {
  throw deleteError;
}

const chunkSize = 250;
for (let index = 0; index < properties.length; index += chunkSize) {
  const chunk = properties.slice(index, index + chunkSize);
  const { error } = await supabase.from("properties").insert(chunk);

  if (error) {
    throw error;
  }
}

console.log(`Seeded ${properties.length} properties.`);
