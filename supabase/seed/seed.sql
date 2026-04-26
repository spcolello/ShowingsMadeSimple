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

insert into public.buyer_profiles (id, user_id, full_name, phone, verification_status, phone_verified_at, verification_submitted_at, terms_accepted_at)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Maya Johnson',
  '+15551201010',
  'approved',
  now(),
  now(),
  now()
) on conflict (id) do nothing;

insert into public.agent_profiles (id, user_id, name, phone, license_number, licensed_state, service_areas, available, verified, license_verified_at, terms_accepted_at, pending_earnings_cents)
values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Sam Rivera',
  '+15551201111',
  'FL-347812',
  'FL',
  array['33131', '33132', '33133'],
  true,
  true,
  now(),
  now(),
  12000
) on conflict (id) do nothing;

insert into public.showing_requests (id, buyer_id, property_address, zip_code, preferred_time, notes, attendees, serious_interest_confirmed, status, payment_status, showing_fee_cents, payment_completed_at)
values (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '88 Brickell Plaza, Miami, FL',
  '33131',
  now() + interval '1 day',
  'Buyer wants to compare natural light and parking access.',
  2,
  true,
  'searching_for_agent',
  'paid',
  7500,
  now()
) on conflict (id) do nothing;
