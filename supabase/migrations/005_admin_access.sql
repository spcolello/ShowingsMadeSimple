alter table public.verification_documents
  add column if not exists internal_notes text;

alter table public.verification_documents
  drop constraint if exists documents_review_status_check;

drop policy if exists "admins manage verification documents" on public.verification_documents;
create policy "admins manage verification documents"
on public.verification_documents for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "admins manage audit logs" on public.audit_logs;
create policy "admins manage audit logs"
on public.audit_logs for insert
with check (public.current_user_role() = 'admin');
