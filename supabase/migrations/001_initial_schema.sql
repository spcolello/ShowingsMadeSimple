create extension if not exists "pgcrypto";

create type public.user_role as enum ('buyer', 'agent', 'admin');
create type public.verification_status as enum ('not_started', 'submitted', 'approved', 'rejected');
create type public.showing_status as enum (
  'draft',
  'payment_pending',
  'paid',
  'searching_for_agent',
  'assigned',
  'completed',
  'cancelled',
  'disputed'
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.buyer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  verification_status public.verification_status not null default 'not_started',
  phone_verified_at timestamptz,
  verification_submitted_at timestamptz,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  name text not null,
  phone text not null,
  license_number text not null,
  licensed_state text not null,
  service_areas text[] not null default '{}',
  available boolean not null default false,
  verified boolean not null default false,
  license_verified_at timestamptz,
  terms_accepted_at timestamptz,
  stripe_connect_account_id text,
  pending_earnings_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.showing_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.buyer_profiles(id) on delete cascade,
  property_address text not null,
  zip_code text not null,
  preferred_time timestamptz not null,
  notes text,
  attendees integer not null check (attendees between 1 and 8),
  serious_interest_confirmed boolean not null default false,
  status public.showing_status not null default 'draft',
  payment_status text not null default 'unpaid',
  showing_fee_cents integer not null default 7500,
  requested_at timestamptz not null default now(),
  payment_completed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

create table public.showing_assignments (
  id uuid primary key default gen_random_uuid(),
  showing_request_id uuid not null unique references public.showing_requests(id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  showing_request_id uuid not null references public.showing_requests(id) on delete cascade,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table public.compliance_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  subject_table text not null,
  subject_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.sms_notifications (
  id uuid primary key default gen_random_uuid(),
  showing_request_id uuid not null references public.showing_requests(id) on delete cascade,
  agent_id uuid references public.agent_profiles(id) on delete set null,
  phone text not null,
  body text not null,
  provider_sid text,
  status text not null default 'queued',
  sent_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  review_status public.verification_status not null default 'submitted',
  created_at timestamptz not null default now()
);

create or replace function public.accept_showing_request(
  p_showing_request_id uuid,
  p_agent_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  inserted_assignment public.showing_assignments;
begin
  insert into public.showing_assignments (showing_request_id, agent_id)
  select p_showing_request_id, p_agent_id
  where exists (
    select 1
    from public.showing_requests
    where id = p_showing_request_id
      and status in ('paid', 'searching_for_agent')
      and not exists (
        select 1 from public.showing_assignments where showing_request_id = p_showing_request_id
      )
  )
  returning * into inserted_assignment;

  if inserted_assignment.id is null then
    return jsonb_build_object('accepted', false, 'message', 'This showing has already been claimed.');
  end if;

  update public.showing_requests
  set status = 'assigned'
  where id = p_showing_request_id;

  insert into public.compliance_logs (action, subject_table, subject_id, metadata)
  values ('Agent assigned', 'showing_requests', p_showing_request_id, jsonb_build_object('agent_id', p_agent_id));

  return jsonb_build_object('accepted', true, 'message', 'You are assigned to this showing.');
end;
$$;

create or replace function public.complete_showing(
  p_showing_request_id uuid,
  p_agent_id uuid
) returns void
language plpgsql
security definer
as $$
begin
  update public.showing_requests
  set status = 'completed', completed_at = now()
  where id = p_showing_request_id
    and exists (
      select 1
      from public.showing_assignments
      where showing_request_id = p_showing_request_id and agent_id = p_agent_id
    );

  update public.showing_assignments
  set completed_at = now()
  where showing_request_id = p_showing_request_id and agent_id = p_agent_id;

  update public.agent_profiles
  set pending_earnings_cents = pending_earnings_cents + 6000
  where id = p_agent_id;

  insert into public.compliance_logs (action, subject_table, subject_id, metadata)
  values ('Showing completed', 'showing_requests', p_showing_request_id, jsonb_build_object('agent_id', p_agent_id));
end;
$$;
