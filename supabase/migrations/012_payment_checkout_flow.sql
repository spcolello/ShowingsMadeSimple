create unique index if not exists payments_showing_request_id_key
on public.payments(showing_request_id);

alter table public.payments
  add column if not exists updated_at timestamptz not null default now();
