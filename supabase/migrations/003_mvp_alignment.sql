alter type public.verification_status add value if not exists 'pending_review';
alter type public.verification_status add value if not exists 'verified';

alter type public.showing_status add value if not exists 'pending';
alter type public.showing_status add value if not exists 'agent_assigned';
alter type public.showing_status add value if not exists 'agent_en_route';
alter type public.showing_status add value if not exists 'refunded';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'agent_approval_status') then
    create type public.agent_approval_status as enum ('pending_review', 'approved', 'rejected', 'suspended');
  end if;
  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type public.document_status as enum ('pending_review', 'verified', 'rejected');
  end if;
end $$;

alter table public.buyer_profiles
  add column if not exists email_verified boolean not null default false,
  add column if not exists identity_verification_status public.verification_status not null default 'not_started',
  add column if not exists financial_verification_status public.verification_status not null default 'not_started',
  add column if not exists government_id_file_url text,
  add column if not exists selfie_file_url text,
  add column if not exists prequalification_letter_url text,
  add column if not exists address jsonb,
  add column if not exists soft_credit_check_consent boolean not null default false,
  add column if not exists buyer_onboarding_completed boolean not null default false,
  add column if not exists address_confirmation text,
  add column if not exists suspended boolean not null default false;

alter table public.agent_profiles
  add column if not exists license_storage_path text,
  add column if not exists brokerage_name text,
  add column if not exists brokerage_verification_status public.verification_status not null default 'not_started',
  add column if not exists w9_storage_path text,
  add column if not exists w9_status public.document_status not null default 'pending_review',
  add column if not exists payout_setup_status text not null default 'not_started',
  add column if not exists approval_status public.agent_approval_status not null default 'pending_review',
  add column if not exists service_radius_miles integer not null default 10,
  add column if not exists available_hours text,
  add column if not exists required_notice_minutes integer not null default 60,
  add column if not exists acceptance_rate numeric not null default 0,
  add column if not exists average_response_seconds integer not null default 0;

alter table public.showing_requests
  add column if not exists mls_number text,
  add column if not exists property_summary text,
  add column if not exists safety_notes text,
  add column if not exists agent_payout_cents integer not null default 6000,
  add column if not exists platform_fee_cents integer not null default 1500;

alter table if exists public.documents rename to verification_documents;

alter table public.verification_documents
  add column if not exists status public.document_status not null default 'pending_review',
  add column if not exists uploaded_at timestamptz not null default now();

create table if not exists public.agent_availability (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  showing_request_id uuid not null references public.showing_requests(id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  amount_cents integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create table if not exists public.safety_flags (
  id uuid primary key default gen_random_uuid(),
  showing_request_id uuid references public.showing_requests(id) on delete cascade,
  reporter_user_id uuid references public.users(id) on delete set null,
  severity text not null default 'low',
  status text not null default 'open',
  note text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.users(id) on delete set null,
  action text not null,
  subject_id uuid,
  note text,
  created_at timestamptz not null default now()
);

alter table public.agent_availability enable row level security;
alter table public.payouts enable row level security;
alter table public.safety_flags enable row level security;
alter table public.audit_logs enable row level security;

create policy "agents manage own availability"
on public.agent_availability for all
using (
  agent_id in (select id from public.agent_profiles where user_id = auth.uid())
  or public.current_user_role() = 'admin'
)
with check (
  agent_id in (select id from public.agent_profiles where user_id = auth.uid())
  or public.current_user_role() = 'admin'
);

create policy "agents read own payouts"
on public.payouts for select
using (
  public.current_user_role() = 'admin'
  or agent_id in (select id from public.agent_profiles where user_id = auth.uid())
);

create policy "admins manage safety flags"
on public.safety_flags for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admins read audit logs"
on public.audit_logs for select
using (public.current_user_role() = 'admin');

drop policy if exists "verified agents can read available requests" on public.showing_requests;

create policy "approved agents can read eligible requests"
on public.showing_requests for select
using (
  public.current_user_role() = 'admin'
  or buyer_id in (select id from public.buyer_profiles where user_id = auth.uid())
  or (
    status in ('pending', 'agent_assigned', 'agent_en_route', 'completed')
    and payment_status in ('held', 'released')
    and exists (
      select 1 from public.agent_profiles
      where user_id = auth.uid()
        and approval_status = 'approved'
        and available = true
        and zip_code = any(service_areas)
    )
  )
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
      and status = 'pending'
      and payment_status = 'held'
      and not exists (
        select 1 from public.showing_assignments where showing_request_id = p_showing_request_id
      )
  )
  returning * into inserted_assignment;

  if inserted_assignment.id is null then
    return jsonb_build_object('accepted', false, 'message', 'This showing has already been claimed.');
  end if;

  update public.showing_requests
  set status = 'agent_assigned'
  where id = p_showing_request_id;

  insert into public.audit_logs (action, subject_id, note)
  values ('agent_assigned', p_showing_request_id, p_agent_id::text);

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
declare
  payout_amount integer;
begin
  update public.showing_requests
  set status = 'completed', payment_status = 'released', completed_at = now()
  where id = p_showing_request_id
    and exists (
      select 1
      from public.showing_assignments
      where showing_request_id = p_showing_request_id and agent_id = p_agent_id
    )
  returning agent_payout_cents into payout_amount;

  update public.showing_assignments
  set completed_at = now()
  where showing_request_id = p_showing_request_id and agent_id = p_agent_id;

  update public.agent_profiles
  set pending_earnings_cents = pending_earnings_cents + coalesce(payout_amount, 0)
  where id = p_agent_id;

  insert into public.payouts (showing_request_id, agent_id, amount_cents, status, released_at)
  values (p_showing_request_id, p_agent_id, coalesce(payout_amount, 0), 'released', now())
  on conflict do nothing;

  insert into public.audit_logs (action, subject_id, note)
  values ('showing_completed_payout_released', p_showing_request_id, p_agent_id::text);
end;
$$;
