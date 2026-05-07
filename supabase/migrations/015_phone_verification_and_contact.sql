alter table public.users
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verified_at timestamptz;

alter table public.buyer_profiles
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verified_at timestamptz;

alter table public.agent_profiles
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verified_at timestamptz;

update public.users
set phone_verified = true,
    phone_verified_at = coalesce(phone_verified_at, now())
where phone_verified is false
  and phone_number is not null
  and phone_number <> '';

update public.buyer_profiles
set phone_verified = true,
    phone_verified_at = coalesce(phone_verified_at, now())
where phone_verified is false
  and coalesce(phone, phone_number, '') <> '';

update public.agent_profiles
set phone_verified = true,
    phone_verified_at = coalesce(phone_verified_at, now())
where phone_verified is false
  and coalesce(phone, phone_number, '') <> '';

create table if not exists public.contact_logs (
  id uuid primary key default gen_random_uuid(),
  showing_request_id uuid references public.showing_requests(id) on delete cascade,
  address_showing_request_id uuid references public.address_showing_requests(id) on delete cascade,
  buyer_user_id uuid references public.users(id) on delete set null,
  buyer_profile_id uuid references public.buyer_profiles(id) on delete set null,
  agent_id uuid references public.agent_profiles(id) on delete set null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.contact_logs enable row level security;

drop policy if exists "admins read contact logs" on public.contact_logs;
create policy "admins read contact logs"
on public.contact_logs for select
using (public.current_user_role() = 'admin');

drop policy if exists "agents read own contact logs" on public.contact_logs;
create policy "agents read own contact logs"
on public.contact_logs for select
using (
  agent_id in (select id from public.agent_profiles where user_id = auth.uid())
  or public.current_user_role() = 'admin'
);
