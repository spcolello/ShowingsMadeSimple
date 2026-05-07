import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PhoneVerificationCard } from "@/components/phone-verification-card";
import { AgentOnboardingSteps } from "@/components/onboarding";
import { AppShell, Section } from "@/components/ui";
import { getSupabaseAdmin } from "@/lib/supabase";

type AgentPhoneRow = {
  phone: string | null;
  phone_number: string | null;
  phone_verified: boolean | null;
};

export default async function AgentPhoneVerificationPage({
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
          <AgentOnboardingSteps current="phone" />
          <PhoneVerificationCard role="agent" phone="+15551201111" sent={params.phoneSent} error={params.phoneError} />
        </Section>
      </AppShell>
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) redirect("/login?error=Supabase is not configured.");

  const { data: agent } = await supabase
    .from("agent_profiles")
    .select("phone, phone_number, phone_verified")
    .eq("user_id", userId)
    .maybeSingle<AgentPhoneRow>();

  if (!agent) redirect("/agent/onboarding");
  if (agent.phone_verified) redirect("/agent/onboarding/license");

  return (
    <AppShell>
      <Section className="max-w-2xl">
        <AgentOnboardingSteps current="phone" />
        <PhoneVerificationCard
          role="agent"
          phone={agent.phone_number ?? agent.phone ?? ""}
          sent={params.phoneSent}
          error={params.phoneError}
        />
      </Section>
    </AppShell>
  );
}
