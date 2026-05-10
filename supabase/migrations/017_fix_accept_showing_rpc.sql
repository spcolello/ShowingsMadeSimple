create or replace function public.accept_showing_request(
  p_showing_request_id uuid,
  p_agent_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  inserted_assignment public.showing_assignments;
begin
  if exists (
    select 1
    from public.showing_assignments
    where showing_request_id = p_showing_request_id
  ) then
    return jsonb_build_object('accepted', false, 'message', 'This showing has already been claimed.');
  end if;

  if not exists (
    select 1
    from public.showing_requests sr
    where sr.id = p_showing_request_id
      and sr.status = 'pending'
      and sr.payment_status = 'held'
  ) then
    return jsonb_build_object('accepted', false, 'message', 'This showing is not ready for agent acceptance yet.');
  end if;

  if not exists (
    select 1
    from public.agent_profiles ap
    where ap.id = p_agent_id
      and ap.email_verified = true
      and ap.license_verification_status = 'approved'
      and ap.brokerage_verification_status = 'approved'
      and ap.w9_verification_status = 'approved'
      and ap.payout_setup_status = 'ready'
      and ap.payouts_enabled = true
      and ap.agent_onboarding_completed = true
      and ap.approval_status = 'approved'
      and ap.is_available = true
  ) then
    return jsonb_build_object('accepted', false, 'message', 'Your agent profile must be approved, payout-ready, and available before accepting showings.');
  end if;

  insert into public.showing_assignments (showing_request_id, agent_id)
  values (p_showing_request_id, p_agent_id)
  returning * into inserted_assignment;

  update public.showing_requests
  set status = 'agent_assigned',
      assigned_agent_id = p_agent_id
  where id = p_showing_request_id;

  insert into public.audit_logs (action, subject_id, note)
  values ('agent_assigned', p_showing_request_id, p_agent_id::text);

  return jsonb_build_object('accepted', true, 'message', 'You are assigned to this showing.');
exception
  when unique_violation then
    return jsonb_build_object('accepted', false, 'message', 'This showing has already been claimed.');
end;
$$;
