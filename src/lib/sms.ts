export async function sendSms(to: string, body: string) {
  console.info("[mock sms - Twilio disabled]", { to, body });
  return { mocked: true, sid: `mock-${Date.now()}` };
}

export async function sendPhoneVerificationCode(to: string) {
  console.info("[mock phone verification - Twilio disabled]", { to, code: "123456" });
  return { mocked: true, sid: `mock-verify-${Date.now()}` };
}

export async function checkPhoneVerificationCode(to: string, code: string) {
  return { mocked: true, approved: code === "123456", status: code === "123456" ? "approved" : "pending", to };
}
