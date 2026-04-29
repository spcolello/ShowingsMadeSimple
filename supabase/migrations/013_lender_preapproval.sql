create table if not exists public.lenders (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  website text,
  nmls_id text not null unique,
  licensed_states text[] not null default '{}',
  service_zip_codes text[] not null default '{}',
  loan_types text[] not null default '{}',
  average_response_minutes integer not null default 30,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.preapproval_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.buyer_profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  lender_id uuid not null references public.lenders(id) on delete restrict,
  property_address text not null,
  property_city text not null,
  property_state text not null,
  property_zip text not null,
  target_purchase_price numeric,
  buyer_income_range text not null,
  buyer_credit_range text not null,
  buyer_down_payment_range text not null,
  buyer_timeline text not null,
  buyer_phone text not null,
  buyer_email text not null,
  consent_to_contact boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint preapproval_requests_status_check check (status in ('new', 'contacted', 'preapproved', 'denied', 'closed')),
  constraint preapproval_requests_consent_check check (consent_to_contact = true)
);

alter table public.lenders enable row level security;
alter table public.preapproval_requests enable row level security;

drop policy if exists "authenticated users read active lenders" on public.lenders;
create policy "authenticated users read active lenders"
on public.lenders for select
using (is_active = true or public.current_user_role() = 'admin');

drop policy if exists "admins manage lenders" on public.lenders;
create policy "admins manage lenders"
on public.lenders for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "buyers read own preapproval requests" on public.preapproval_requests;
create policy "buyers read own preapproval requests"
on public.preapproval_requests for select
using (
  public.current_user_role() = 'admin'
  or buyer_id in (select id from public.buyer_profiles where user_id = auth.uid())
);

drop policy if exists "buyers create own preapproval requests" on public.preapproval_requests;
create policy "buyers create own preapproval requests"
on public.preapproval_requests for insert
with check (buyer_id in (select id from public.buyer_profiles where user_id = auth.uid()));

drop policy if exists "admins manage preapproval requests" on public.preapproval_requests;
create policy "admins manage preapproval requests"
on public.preapproval_requests for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create index if not exists lenders_active_state_idx on public.lenders using gin (licensed_states);
create index if not exists lenders_service_zip_idx on public.lenders using gin (service_zip_codes);
create index if not exists preapproval_requests_lender_idx on public.preapproval_requests(lender_id);
create index if not exists preapproval_requests_buyer_idx on public.preapproval_requests(buyer_id);

insert into public.lenders (
  company_name,
  contact_name,
  email,
  phone,
  website,
  nmls_id,
  licensed_states,
  service_zip_codes,
  loan_types,
  average_response_minutes,
  is_active,
  is_featured
) values
  (
    'Capital Region Home Loans',
    'Dana Mitchell',
    'dana@capitalregionhomeloans.example',
    '(518) 555-0141',
    'https://example.com/capital-region-home-loans',
    'NMLS-120100',
    array['NY'],
    array['12010', '12086', '12110', '12203', '12309'],
    array['Conventional', 'FHA', 'VA'],
    15,
    true,
    true
  ),
  (
    'Northeast Mortgage Group',
    'Chris Walker',
    'chris@northeastmortgage.example',
    '(518) 555-0188',
    'https://example.com/northeast-mortgage-group',
    'NMLS-330210',
    array['NY', 'CT', 'MA'],
    array[]::text[],
    array['Conventional', 'Jumbo', 'FHA'],
    30,
    true,
    false
  ),
  (
    'Shoreline Lending Partners',
    'Morgan Lee',
    'morgan@shorelinelending.example',
    '(203) 555-0119',
    'https://example.com/shoreline-lending-partners',
    'NMLS-640980',
    array['CT'],
    array['06498', '06475', '06413', '06437'],
    array['Conventional', 'FHA'],
    20,
    true,
    true
  )
on conflict (nmls_id) do update
set
  company_name = excluded.company_name,
  contact_name = excluded.contact_name,
  email = excluded.email,
  phone = excluded.phone,
  website = excluded.website,
  licensed_states = excluded.licensed_states,
  service_zip_codes = excluded.service_zip_codes,
  loan_types = excluded.loan_types,
  average_response_minutes = excluded.average_response_minutes,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured;

insert into public.properties (
  address, city, state, zip, mls_number, price, beds, baths, lat, lng, image_url, listing_url, status
) values
  ('42 Market St', 'Amsterdam', 'NY', '12010', 'GLMLS2026001', 289000, 3, 2, 42.9387, -74.1882, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80', 'https://example.com/listings/42-market-st-amsterdam', 'active'),
  ('18 Locust Ave', 'Amsterdam', 'NY', '12010', 'GLMLS2026002', 349000, 4, 2.5, 42.9434, -74.1961, 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=900&q=80', 'https://example.com/listings/18-locust-ave-amsterdam', 'active')
on conflict (listing_url) do nothing;
