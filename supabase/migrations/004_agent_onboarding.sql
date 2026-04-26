alter table public.agent_profiles
  alter column license_number drop not null,
  alter column licensed_state drop not null;

alter table public.agent_profiles
  add column if not exists email_verified boolean not null default false,
  add column if not exists license_state text,
  add column if not exists license_expiration_date date,
  add column if not exists license_file_url text,
  add column if not exists license_verification_status public.verification_status not null default 'pending_review',
  add column if not exists brokerage_address text,
  add column if not exists broker_manager_name text,
  add column if not exists broker_manager_email text,
  add column if not exists broker_manager_phone text,
  add column if not exists w9_file_url text,
  add column if not exists w9_verification_status public.verification_status not null default 'pending_review',
  add column if not exists payout_provider_account_id text,
  add column if not exists payouts_enabled boolean not null default false,
  add column if not exists agent_onboarding_completed boolean not null default false,
  add column if not exists available_days text[] not null default '{}',
  add column if not exists available_start_time time,
  add column if not exists available_end_time time,
  add column if not exists is_available boolean not null default false,
  add column if not exists total_earnings_cents integer not null default 0,
  add column if not exists completed_showings_count integer not null default 0;

update public.agent_profiles
set
  license_state = coalesce(license_state, licensed_state),
  license_verification_status = case when approval_status = 'approved' then 'approved'::public.verification_status else license_verification_status end,
  w9_verification_status = case when w9_status = 'verified' then 'approved'::public.verification_status else w9_verification_status end,
  is_available = available
where true;

create table if not exists public.showing_declines (
  id uuid primary key default gen_random_uuid(),
  showing_request_id uuid not null references public.showing_requests(id) on delete cascade,
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  declined_at timestamptz not null default now(),
  unique (showing_request_id, agent_id)
);

alter table public.showing_declines enable row level security;

create policy "agents read own declines"
on public.showing_declines for select
using (
  public.current_user_role() = 'admin'
  or agent_id in (select id from public.agent_profiles where user_id = auth.uid())
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
    from public.showing_requests sr
    where sr.id = p_showing_request_id
      and sr.status = 'pending'
      and sr.payment_status = 'held'
      and not exists (
        select 1 from public.showing_assignments where showing_request_id = p_showing_request_id
      )
  )
  and exists (
    select 1
    from public.agent_profiles ap
    where ap.id = p_agent_id
      and ap.email_verified = true
      and ap.license_verification_status = 'approved'
      and ap.brokerage_verification_status = 'approved'
      and ap.w9_verification_status = 'approved'
      and ap.payout_setup_status = 'ready'
      and ap.payouts_enabled = true
      and ap.agent_onboarding_completed = true
      and ap.approval_status = 'approved'
      and ap.is_available = true
  )
  returning * into inserted_assignment;

  if inserted_assignment.id is null then
    return jsonb_build_object('accepted', false, 'message', 'This showing has already been claimed or your agent profile is not approved.');
  end if;

  update public.showing_requests
  set status = 'agent_assigned'
  where id = p_showing_request_id;

  insert into public.audit_logs (action, subject_id, note)
  values ('agent_assigned', p_showing_request_id, p_agent_id::text);

  return jsonb_build_object('accepted', true, 'message', 'You are assigned to this showing.');
end;
$$;
