create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  price numeric not null,
  beds integer not null,
  baths numeric not null,
  lat numeric not null,
  lng numeric not null,
  image_url text,
  listing_url text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create unique index if not exists properties_listing_url_key on public.properties (listing_url);

alter table public.properties enable row level security;

drop policy if exists "authenticated users read active properties" on public.properties;
create policy "authenticated users read active properties"
on public.properties for select
using (auth.uid() is not null and status = 'active');

alter table public.showing_requests
  add column if not exists property_id uuid references public.properties(id) on delete set null,
  add column if not exists requested_time timestamptz,
  add column if not exists assigned_agent_id uuid,
  alter column property_address drop not null,
  alter column zip_code drop not null,
  alter column attendees set default 1;

drop policy if exists "buyers create own property showing requests" on public.showing_requests;
create policy "buyers create own property showing requests"
on public.showing_requests for insert
with check (
  buyer_id in (select id from public.buyer_profiles where user_id = auth.uid())
);

drop policy if exists "buyers read own property showing requests" on public.showing_requests;
create policy "buyers read own property showing requests"
on public.showing_requests for select
using (
  public.current_user_role() = 'admin'
  or buyer_id in (select id from public.buyer_profiles where user_id = auth.uid())
);
