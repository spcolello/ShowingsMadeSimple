alter table public.users
  add column if not exists full_name text,
  add column if not exists phone_number text,
  add column if not exists email_verified boolean not null default false;

alter table public.buyer_profiles
  add column if not exists phone_number text;

alter table public.agent_profiles
  add column if not exists phone_number text;

alter table public.agent_profiles
  alter column payout_setup_status set default 'incomplete';

update public.agent_profiles
set payout_setup_status = 'incomplete'
where payout_setup_status = 'not_started';

create or replace function public.sync_auth_email_verified()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.users
  set email_verified = new.email_confirmed_at is not null
  where id = new.id;

  update public.buyer_profiles
  set email_verified = new.email_confirmed_at is not null
  where user_id = new.id;

  update public.agent_profiles
  set email_verified = new.email_confirmed_at is not null
  where user_id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_email_confirmed on auth.users;
create trigger on_auth_email_confirmed
after update of email_confirmed_at on auth.users
for each row
execute function public.sync_auth_email_verified();
