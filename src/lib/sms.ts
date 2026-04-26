import twilio from "twilio";
import { env } from "./env";

export async function sendSms(to: string, body: string) {
  if (
    env.smsMockMode ||
    !env.twilioAccountSid ||
    !env.twilioAuthToken ||
    !env.twilioFromNumber
  ) {
    console.info("[mock sms]", { to, body });
    return { mocked: true, sid: `mock-${Date.now()}` };
  }

  const client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  const message = await client.messages.create({
    to,
    from: env.twilioFromNumber,
    body,
  });

  return { mocked: false, sid: message.sid };
}
