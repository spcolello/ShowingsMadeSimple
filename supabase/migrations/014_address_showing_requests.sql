alter table public.agent_profiles
  add column if not exists mls_name text,
  add column if not exists service_zips text[] not null default '{}',
  add column if not exists home_lat numeric,
  add column if not exists home_lng numeric,
  add column if not exists is_active boolean not null default true;

update public.agent_profiles
set
  service_zips = case when service_zips = '{}' then service_areas else service_zips end,
  is_active = coalesce(is_active, true)
where true;

create table if not exists public.address_showing_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid references public.users(id) on delete set null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  lat numeric not null,
  lng numeric not null,
  preferred_time timestamptz not null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text not null,
  preapproved boolean not null default false,
  notes text,
  status text not null default 'pending_agent',
  assigned_agent_id uuid references public.agent_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint address_showing_status_check check (
    status in (
      'pending_agent',
      'agent_accepted_checking_mls',
      'available_confirmed',
      'not_available',
      'reschedule_needed',
      'completed',
      'cancelled',
      'no_agents_found'
    )
  )
);

create table if not exists public.address_showing_notifications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.address_showing_requests(id) on delete cascade,
  recipient_type text not null,
  recipient_agent_id uuid references public.agent_profiles(id) on delete set null,
  recipient_email text,
  recipient_phone text,
  message text not null,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

alter table public.address_showing_requests enable row level security;
alter table public.address_showing_notifications enable row level security;

drop policy if exists "buyers read own address requests" on public.address_showing_requests;
create policy "buyers read own address requests"
on public.address_showing_requests for select
using (
  public.current_user_role() = 'admin'
  or buyer_user_id = auth.uid()
  or assigned_agent_id in (select id from public.agent_profiles where user_id = auth.uid())
);

drop policy if exists "buyers create own address requests" on public.address_showing_requests;
create policy "buyers create own address requests"
on public.address_showing_requests for insert
with check (buyer_user_id = auth.uid());

drop policy if exists "admins manage address requests" on public.address_showing_requests;
create policy "admins manage address requests"
on public.address_showing_requests for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "users read own address notifications" on public.address_showing_notifications;
create policy "users read own address notifications"
on public.address_showing_notifications for select
using (
  public.current_user_role() = 'admin'
  or recipient_agent_id in (select id from public.agent_profiles where user_id = auth.uid())
);

create index if not exists address_showing_requests_zip_idx on public.address_showing_requests(zip);
create index if not exists address_showing_requests_status_idx on public.address_showing_requests(status);
create index if not exists address_showing_requests_assigned_agent_idx on public.address_showing_requests(assigned_agent_id);
create index if not exists agent_profiles_service_zips_idx on public.agent_profiles using gin(service_zips);
