import { Card, Field } from "@/components/ui";

export function PhoneVerificationCard({
  role,
  phone,
  sent,
  error,
}: {
  role: "buyer" | "agent";
  phone: string;
  sent?: string;
  error?: string;
}) {
  const returnTo = `/${role}/onboarding/phone`;

  return (
    <Card>
      <p className="text-sm font-semibold text-teal-700">Phone verification</p>
      <h1 className="mt-1 text-2xl font-semibold">Verify your phone</h1>
      <p className="mt-2 text-sm text-slate-600">
        We use verified phone numbers for showing safety and time-sensitive updates.
      </p>
      <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        Verification number: <span className="font-semibold">{phone || "No phone saved"}</span>
      </p>
      {sent === "true" && (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Code sent. In local mock mode, use code 123456.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <form action="/api/phone/send-code" method="post" className="grid gap-3">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-100">
            Send verification code
          </button>
        </form>
        <form action="/api/phone/verify-code" method="post" className="grid gap-3">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Field label="Verification code" name="code" inputMode="numeric" placeholder="123456" />
          <button className="min-h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
            Verify phone
          </button>
        </form>
      </div>
    </Card>
  );
}
