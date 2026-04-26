alter table public.users enable row level security;
alter table public.buyer_profiles enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.showing_requests enable row level security;
alter table public.showing_assignments enable row level security;
alter table public.payments enable row level security;
alter table public.compliance_logs enable row level security;
alter table public.sms_notifications enable row level security;
alter table public.documents enable row level security;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role from public.users where id = auth.uid()
$$;

create policy "users can read own user row"
on public.users for select
using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "buyers manage own profile"
on public.buyer_profiles for all
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "agents manage own profile"
on public.agent_profiles for all
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "verified agents can read available requests"
on public.showing_requests for select
using (
  public.current_user_role() = 'admin'
  or buyer_id in (select id from public.buyer_profiles where user_id = auth.uid())
  or (
    status in ('paid', 'searching_for_agent', 'assigned', 'completed')
    and exists (
      select 1 from public.agent_profiles
      where user_id = auth.uid()
        and verified = true
        and zip_code = any(service_areas)
    )
  )
);

create policy "buyers create own requests"
on public.showing_requests for insert
with check (buyer_id in (select id from public.buyer_profiles where user_id = auth.uid()));

create policy "buyers read own payments"
on public.payments for select
using (
  public.current_user_role() = 'admin'
  or showing_request_id in (
    select sr.id
    from public.showing_requests sr
    join public.buyer_profiles bp on bp.id = sr.buyer_id
    where bp.user_id = auth.uid()
  )
);

create policy "agents read own assignments"
on public.showing_assignments for select
using (
  public.current_user_role() = 'admin'
  or agent_id in (select id from public.agent_profiles where user_id = auth.uid())
);

create policy "admins read compliance"
on public.compliance_logs for select
using (public.current_user_role() = 'admin');

create policy "owners read documents"
on public.documents for select
using (owner_user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "owners insert documents"
on public.documents for insert
with check (owner_user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "admins read sms"
on public.sms_notifications for select
using (public.current_user_role() = 'admin');
