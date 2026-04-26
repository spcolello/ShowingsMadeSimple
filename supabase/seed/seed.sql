insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('00000000-0000-0000-0000-000000000001', 'maya@example.com', crypt('password123', gen_salt('bf')), now(), '{}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', 'sam@example.com', crypt('password123', gen_salt('bf')), now(), '{}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', 'admin@example.com', crypt('password123', gen_salt('bf')), now(), '{}', '{}', 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.users (id, role, email)
values
  ('00000000-0000-0000-0000-000000000001', 'buyer', 'maya@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'agent', 'sam@example.com'),
  ('00000000-0000-0000-0000-000000000003', 'admin', 'admin@example.com')
on conflict (id) do nothing;

insert into public.buyer_profiles (
  id,
  user_id,
  full_name,
  phone,
  email_verified,
  verification_status,
  identity_verification_status,
  financial_verification_status,
  government_id_file_url,
  selfie_file_url,
  prequalification_letter_url,
  address,
  soft_credit_check_consent,
  buyer_onboarding_completed,
  suspended,
  phone_verified_at,
  verification_submitted_at,
  terms_accepted_at
)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Maya Johnson',
  '+15551201010',
  true,
  'verified',
  'approved',
  'approved',
  'supabase://buyer-verification/buyer-demo/government-id.pdf',
  'supabase://buyer-verification/buyer-demo/selfie.jpg',
  'supabase://buyer-verification/buyer-demo/prequal.pdf',
  '{"street":"1200 Brickell Bay Dr","city":"Miami","state":"FL","zipCode":"33131"}'::jsonb,
  false,
  true,
  false,
  now(),
  now(),
  now()
) on conflict (id) do nothing;

insert into public.agent_profiles (
  id,
  user_id,
  name,
  phone,
  license_number,
  licensed_state,
  brokerage_name,
  brokerage_verification_status,
  w9_status,
  payout_setup_status,
  approval_status,
  service_areas,
  service_radius_miles,
  available_hours,
  required_notice_minutes,
  available,
  pending_earnings_cents,
  acceptance_rate,
  average_response_seconds,
  terms_accepted_at
)
values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Sam Rivera',
  '+15551201111',
  'FL-347812',
  'FL',
  'Harbor Realty',
  'verified',
  'verified',
  'ready',
  'approved',
  array['33131', '33132', '33133'],
  12,
  'Mon-Fri 9:00 AM-6:00 PM',
  60,
  true,
  12000,
  0.92,
  48,
  now()
) on conflict (id) do nothing;

insert into public.showing_requests (
  id,
  buyer_id,
  property_address,
  mls_number,
  property_summary,
  zip_code,
  preferred_time,
  safety_notes,
  attendees,
  serious_interest_confirmed,
  status,
  payment_status,
  showing_fee_cents,
  agent_payout_cents,
  platform_fee_cents,
  payment_completed_at
)
values (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '88 Brickell Plaza, Miami, FL',
  'A11550123',
  '2 bed condo, buyer-entered info only',
  '33131',
  now() + interval '1 day',
  'Buyer wants to compare natural light and parking access.',
  2,
  true,
  'pending',
  'held',
  7500,
  6000,
  1500,
  now()
) on conflict (id) do nothing;
