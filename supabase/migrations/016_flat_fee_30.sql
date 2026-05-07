alter table public.showing_requests
  alter column showing_fee_cents set default 3000;

alter table public.showing_requests
  alter column agent_payout_cents set default 2500,
  alter column platform_fee_cents set default 500;

update public.showing_requests
set showing_fee_cents = 3000,
    agent_payout_cents = 2500,
    platform_fee_cents = 500
where payment_status in ('unpaid', 'failed')
  and showing_fee_cents = 7500;
