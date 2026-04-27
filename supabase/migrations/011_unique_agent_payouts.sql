create unique index if not exists payouts_showing_agent_key
on public.payouts (showing_request_id, agent_id);
