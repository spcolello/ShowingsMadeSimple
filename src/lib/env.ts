export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripePriceId: process.env.STRIPE_SHOWING_PRICE_ID,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
  twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  smsMockMode: process.env.SMS_MOCK_MODE
    ? process.env.SMS_MOCK_MODE === "true"
    : process.env.NODE_ENV !== "production",
  enableDemoAccess: process.env.ENABLE_DEMO_ACCESS
    ? process.env.ENABLE_DEMO_ACCESS === "true"
    : process.env.NODE_ENV !== "production",
  launchState: process.env.LAUNCH_STATE ?? "NY",
  requirePhoneVerification: process.env.REQUIRE_PHONE_VERIFICATION === "true",
};

export function hasSupabaseServerConfig() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

export function hasSupabasePublicConfig() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function isProduction() {
  return env.nodeEnv === "production";
}

export function hasTwilioSmsConfig() {
  return Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioFromNumber);
}

export function hasTwilioVerifyConfig() {
  return Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioVerifyServiceSid);
}
