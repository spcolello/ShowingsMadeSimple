import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = rest.join("=").trim();
      }
    }
  } catch {
    // Environment variables may already be provided by the host.
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_FULL_NAME ?? "Admin";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password || !supabaseUrl || !serviceRoleKey) {
  console.error("Required env: ADMIN_EMAIL, ADMIN_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (password.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const { data: created, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    full_name: fullName,
    role: "admin",
  },
});

const existingUser = error ? await findAuthUserByEmail(email) : null;
const adminUser = created.user ?? existingUser;

if (!adminUser) {
  console.error(error?.message ?? "Admin account could not be created.");
  process.exit(1);
}

if (existingUser) {
  const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...existingUser.user_metadata,
      full_name: fullName,
      role: "admin",
    },
  });

  if (updateError) {
    console.error(updateError.message);
    process.exit(1);
  }
}

const { error: upsertError } = await supabase.from("users").upsert({
  id: adminUser.id,
  role: "admin",
  email,
  full_name: fullName,
  email_verified: true,
});

if (upsertError) {
  console.error(upsertError.message);
  process.exit(1);
}

console.log(`${existingUser ? "Updated" : "Created"} admin account: ${email}`);

async function findAuthUserByEmail(targetEmail) {
  const normalizedEmail = targetEmail.toLowerCase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (listError) {
      console.error(listError.message);
      process.exit(1);
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);
    if (user) return user;
    if (data.users.length < 100) return null;
  }

  return null;
}
