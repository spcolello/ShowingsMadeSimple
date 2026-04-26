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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function createUser(id, email, password, role, fullName, phone) {
  const { data, error } = await supabase.auth.admin.createUser({
    id,
    email,
    password,
    phone,
    email_confirm: true,
    user_metadata: { role, full_name: fullName },
  });

  if (error && !error.message.toLowerCase().includes("already")) {
    throw error;
  }

  await supabase.from("users").upsert({
    id,
    role,
    email,
    full_name: fullName,
    phone_number: phone,
    email_verified: true,
  });

  return data.user;
}

async function checked(label, promise) {
  const { error } = await promise;
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

await createUser("00000000-0000-0000-0000-000000000001", "maya@example.com", "password123", "buyer", "Maya Johnson", "+15551201010");
await createUser("00000000-0000-0000-0000-000000000002", "sam@example.com", "password123", "agent", "Sam Rivera", "+15551201111");
await createUser("00000000-0000-0000-0000-000000000003", "admin@example.com", "password123", "admin", "Admin", "+15551209999");
await createUser("00000000-0000-0000-0000-000000000004", "admin@gmail.com", "admin", "admin", "Admin", "+15551209998");

await checked(
  "buyer profile",
  supabase.from("buyer_profiles").upsert({
    id: "10000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000001",
    full_name: "Maya Johnson",
    phone: "+15551201010",
    phone_number: "+15551201010",
    email_verified: true,
    verification_status: "approved",
    identity_verification_status: "approved",
    financial_verification_status: "approved",
    government_id_file_url: "supabase://buyer-verification/buyer-demo/government-id.pdf",
    selfie_file_url: "supabase://buyer-verification/buyer-demo/selfie.jpg",
    prequalification_letter_url: "supabase://buyer-verification/buyer-demo/prequal.pdf",
    address: { street: "1200 Brickell Bay Dr", city: "Miami", state: "FL", zipCode: "33131" },
    soft_credit_check_consent: false,
    buyer_onboarding_completed: true,
    suspended: false,
    phone_verified_at: new Date().toISOString(),
    verification_submitted_at: new Date().toISOString(),
    terms_accepted_at: new Date().toISOString(),
  }),
);

await checked(
  "agent profile",
  supabase.from("agent_profiles").upsert({
    id: "20000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000002",
    name: "Sam Rivera",
    phone: "+15551201111",
    phone_number: "+15551201111",
    email_verified: true,
    license_number: "FL-347812",
    licensed_state: "FL",
    license_state: "FL",
    license_expiration_date: "2027-08-31",
    license_file_url: "supabase://agent-verification/agent-sam/license.pdf",
    license_verification_status: "approved",
    brokerage_name: "Harbor Realty",
    brokerage_address: "200 Biscayne Blvd, Miami, FL 33131",
    broker_manager_name: "Jordan Lee",
    broker_manager_email: "jordan@harbor.example",
    broker_manager_phone: "+15551204444",
    brokerage_verification_status: "approved",
    w9_status: "verified",
    w9_file_url: "supabase://agent-verification/agent-sam/w9.pdf",
    w9_verification_status: "approved",
    payout_provider_account_id: "acct_mock_sam",
    payout_setup_status: "ready",
    payouts_enabled: true,
    agent_onboarding_completed: true,
    approval_status: "approved",
    service_areas: ["33131", "33132", "33133"],
    available_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    available_start_time: "09:00",
    available_end_time: "18:00",
    service_radius_miles: 12,
    available_hours: "Mon-Fri 9:00 AM-6:00 PM",
    required_notice_minutes: 60,
    available: true,
    is_available: true,
    pending_earnings_cents: 12000,
    total_earnings_cents: 18000,
    completed_showings_count: 3,
    acceptance_rate: 0.92,
    average_response_seconds: 48,
    terms_accepted_at: new Date().toISOString(),
  }),
);

await checked(
  "showing request",
  supabase.from("showing_requests").upsert({
    id: "30000000-0000-0000-0000-000000000001",
    buyer_id: "10000000-0000-0000-0000-000000000001",
    property_address: "88 Brickell Plaza, Miami, FL",
    mls_number: "A11550123",
    property_summary: "2 bed condo, buyer-entered info only",
    zip_code: "33131",
    preferred_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    safety_notes: "Buyer wants to compare natural light and parking access.",
    attendees: 2,
    serious_interest_confirmed: true,
    status: "pending",
    payment_status: "held",
    showing_fee_cents: 7500,
    agent_payout_cents: 6000,
    platform_fee_cents: 1500,
    payment_completed_at: new Date().toISOString(),
  }),
);

console.log("Supabase seed complete");
