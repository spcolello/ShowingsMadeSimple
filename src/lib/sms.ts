import { env, hasTwilioSmsConfig, hasTwilioVerifyConfig } from "./env";

export async function sendSms(to: string, body: string) {
  if (env.smsMockMode) {
    console.info("[mock sms]", { to, body });
    return { mocked: true, sid: `mock-${Date.now()}` };
  }

  if (!hasTwilioSmsConfig()) {
    throw new Error("Twilio SMS is not configured.");
  }

  const { default: twilio } = await import("twilio");
  const client = twilio(env.twilioAccountSid!, env.twilioAuthToken!);
  const message = await client.messages.create({
    to,
    from: env.twilioFromNumber!,
    body,
  });

  return { mocked: false, sid: message.sid };
}

export async function sendPhoneVerificationCode(to: string) {
  if (env.smsMockMode) {
    console.info("[mock phone verification]", { to, code: "123456" });
    return { mocked: true, sid: `mock-verify-${Date.now()}` };
  }

  if (!hasTwilioVerifyConfig()) {
    throw new Error("Twilio Verify is not configured.");
  }

  const { default: twilio } = await import("twilio");
  const client = twilio(env.twilioAccountSid!, env.twilioAuthToken!);
  const verification = await client.verify.v2
    .services(env.twilioVerifyServiceSid!)
    .verifications.create({ to, channel: "sms" });

  return { mocked: false, sid: verification.sid };
}

export async function checkPhoneVerificationCode(to: string, code: string) {
  if (env.smsMockMode) {
    return { mocked: true, approved: code === "123456", status: code === "123456" ? "approved" : "pending", to };
  }

  if (!hasTwilioVerifyConfig()) {
    throw new Error("Twilio Verify is not configured.");
  }

  const { default: twilio } = await import("twilio");
  const client = twilio(env.twilioAccountSid!, env.twilioAuthToken!);
  const check = await client.verify.v2
    .services(env.twilioVerifyServiceSid!)
    .verificationChecks.create({ to, code });

  return { mocked: false, approved: check.status === "approved", status: check.status, to };
}
