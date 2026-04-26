type BuyerOnboardingRow = {
  email_verified?: boolean | null;
  government_id_file_url?: string | null;
  selfie_file_url?: string | null;
  address?: unknown | null;
  soft_credit_check_consent?: boolean | null;
  prequalification_letter_url?: string | null;
  buyer_onboarding_completed?: boolean | null;
};

type AgentOnboardingRow = {
  email_verified?: boolean | null;
  license_number?: string | null;
  license_file_url?: string | null;
  brokerage_name?: string | null;
  broker_manager_name?: string | null;
  broker_manager_email?: string | null;
  w9_file_url?: string | null;
  payout_provider_account_id?: string | null;
  payout_setup_status?: string | null;
  payouts_enabled?: boolean | null;
  agent_onboarding_completed?: boolean | null;
};

export function nextBuyerOnboardingPath(profile?: BuyerOnboardingRow | null) {
  if (!profile?.email_verified) {
    return "/buyer/onboarding/email";
  }

  if (!profile.government_id_file_url || !profile.selfie_file_url || !profile.address) {
    return "/buyer/onboarding/identity";
  }

  if (!profile.soft_credit_check_consent && !profile.prequalification_letter_url) {
    return "/buyer/onboarding/financial";
  }

  if (!profile.buyer_onboarding_completed) {
    return "/buyer/onboarding/complete";
  }

  return "/buyer/dashboard";
}

export function nextAgentOnboardingPath(profile?: AgentOnboardingRow | null) {
  if (!profile?.email_verified) {
    return "/agent/onboarding/email";
  }

  if (!profile.license_number || !profile.license_file_url) {
    return "/agent/onboarding/license";
  }

  if (!profile.brokerage_name || !profile.broker_manager_name || !profile.broker_manager_email) {
    return "/agent/onboarding/brokerage";
  }

  if (!profile.w9_file_url) {
    return "/agent/onboarding/tax";
  }

  if (!profile.payout_provider_account_id || profile.payout_setup_status !== "ready" || !profile.payouts_enabled) {
    return "/agent/onboarding/payout";
  }

  if (!profile.agent_onboarding_completed) {
    return "/agent/onboarding/complete";
  }

  return "/agent/dashboard";
}
