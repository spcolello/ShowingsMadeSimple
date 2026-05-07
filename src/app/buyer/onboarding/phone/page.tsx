import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PhoneVerificationCard } from "@/components/phone-verification-card";
import { BuyerOnboardingSteps } from "@/components/onboarding";
import { AppShell, Section } from "@/components/ui";
import { getSupabaseAdmin } from "@/lib/supabase";

type BuyerPhoneRow = {
  phone: string | null;
  phone_number: string | null;
  phone_verified: boolean | null;
};

export default async function BuyerPhoneVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ phoneSent?: string; phoneError?: string }>;
}) {
  const params = await searchParams;
  const userId = (await cookies()).get("sms_user_id")?.value;
  if (!userId) redirect("/login");

  if (userId.startsWith("mock-")) {
    return (
      <AppShell>
        <Section className="max-w-2xl">
          <BuyerOnboardingSteps current="phone" />
          <PhoneVerificationCard role="buyer" phone="+15551201010" sent={params.phoneSent} error={params.phoneError} />
        </Section>
      </AppShell>
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) redirect("/login?error=Supabase is not configured.");

  const { data: buyer } = await supabase
    .from("buyer_profiles")
    .select("phone, phone_number, phone_verified")
    .eq("user_id", userId)
    .maybeSingle<BuyerPhoneRow>();

  if (!buyer) redirect("/buyer/onboarding");
  if (buyer.phone_verified) redirect("/buyer/onboarding/identity");

  return (
    <AppShell>
      <Section className="max-w-2xl">
        <BuyerOnboardingSteps current="phone" />
        <PhoneVerificationCard
          role="buyer"
          phone={buyer.phone_number ?? buyer.phone ?? ""}
          sent={params.phoneSent}
          error={params.phoneError}
        />
      </Section>
    </AppShell>
  );
}
