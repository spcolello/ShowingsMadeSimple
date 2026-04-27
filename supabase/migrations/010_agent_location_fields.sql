alter table public.agent_profiles
  add column if not exists service_location text,
  add column if not exists service_lat numeric,
  add column if not exists service_lng numeric;
