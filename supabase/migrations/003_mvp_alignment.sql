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

