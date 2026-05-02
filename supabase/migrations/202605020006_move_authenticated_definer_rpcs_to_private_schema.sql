create schema if not exists private;

revoke usage on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.approve_ledger_book_join_request(uuid) set schema private;
alter function public.can_view_profile(uuid) set schema private;
alter function public.create_owned_ledger_book(text) set schema private;
alter function public.ensure_own_personal_ledger_book() set schema private;
alter function public.get_accessible_ledger_book(uuid) set schema private;
alter function public.get_accessible_ledger_books() set schema private;
alter function public.get_active_ledger_book() set schema private;
alter function public.get_ledger_book_members(uuid) set schema private;
alter function public.get_pending_ledger_book_join_requests(uuid) set schema private;
alter function public.is_book_editor(uuid) set schema private;
alter function public.is_book_member(uuid) set schema private;
alter function public.is_book_owner(uuid) set schema private;
alter function public.leave_active_ledger_book() set schema private;
alter function public.reject_ledger_book_join_request(uuid) set schema private;
alter function public.remove_member_from_active_ledger_book(uuid) set schema private;
alter function public.request_ledger_book_join_by_code(text) set schema private;
alter function public.switch_active_ledger_book(uuid) set schema private;
alter function public.update_active_ledger_book_name(text) set schema private;
alter function public.update_own_profile_display_name(text) set schema private;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

create or replace function public.approve_ledger_book_join_request(target_request_id uuid)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.approve_ledger_book_join_request(target_request_id);
$$;

create or replace function public.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, private
as $$
  select private.can_view_profile(target_user_id);
$$;

create or replace function public.create_owned_ledger_book(next_name text)
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.create_owned_ledger_book(next_name);
$$;

create or replace function public.ensure_own_personal_ledger_book()
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.ensure_own_personal_ledger_book();
$$;

create or replace function public.get_accessible_ledger_book(target_book_id uuid)
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_accessible_ledger_book(target_book_id);
$$;

create or replace function public.get_accessible_ledger_books()
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text,
  member_role text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_accessible_ledger_books();
$$;

create or replace function public.get_active_ledger_book()
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_active_ledger_book();
$$;

create or replace function public.get_ledger_book_members(target_book_id uuid)
returns table (
  user_id uuid,
  role text,
  display_name text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_ledger_book_members(target_book_id);
$$;

create or replace function public.get_pending_ledger_book_join_requests(target_book_id uuid)
returns table (
  id uuid,
  requester_user_id uuid,
  display_name text,
  created_at timestamptz
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_pending_ledger_book_join_requests(target_book_id);
$$;

create or replace function public.is_book_editor(target_book_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, private
as $$
  select private.is_book_editor(target_book_id);
$$;

create or replace function public.is_book_member(target_book_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, private
as $$
  select private.is_book_member(target_book_id);
$$;

create or replace function public.is_book_owner(target_book_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, private
as $$
  select private.is_book_owner(target_book_id);
$$;

create or replace function public.leave_active_ledger_book()
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.leave_active_ledger_book();
$$;

create or replace function public.reject_ledger_book_join_request(target_request_id uuid)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.reject_ledger_book_join_request(target_request_id);
$$;

create or replace function public.remove_member_from_active_ledger_book(target_user_id uuid)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.remove_member_from_active_ledger_book(target_user_id);
$$;

create or replace function public.request_ledger_book_join_by_code(input_code text)
returns text
language sql
security invoker
set search_path = public, private
as $$
  select private.request_ledger_book_join_by_code(input_code);
$$;

create or replace function public.switch_active_ledger_book(target_book_id uuid)
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.switch_active_ledger_book(target_book_id);
$$;

create or replace function public.update_active_ledger_book_name(next_name text)
returns public.ledger_books
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.update_active_ledger_book_name(next_name);
$$;

create or replace function public.update_own_profile_display_name(next_display_name text)
returns text
language sql
security invoker
set search_path = public, private
as $$
  select private.update_own_profile_display_name(next_display_name);
$$;

revoke execute on all functions in schema public from public, anon;

grant execute on function public.approve_ledger_book_join_request(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.create_owned_ledger_book(text) to authenticated;
grant execute on function public.ensure_own_personal_ledger_book() to authenticated;
grant execute on function public.get_accessible_ledger_book(uuid) to authenticated;
grant execute on function public.get_accessible_ledger_books() to authenticated;
grant execute on function public.get_active_ledger_book() to authenticated;
grant execute on function public.get_ledger_book_members(uuid) to authenticated;
grant execute on function public.get_pending_ledger_book_join_requests(uuid) to authenticated;
grant execute on function public.is_book_editor(uuid) to authenticated;
grant execute on function public.is_book_member(uuid) to authenticated;
grant execute on function public.is_book_owner(uuid) to authenticated;
grant execute on function public.leave_active_ledger_book() to authenticated;
grant execute on function public.reject_ledger_book_join_request(uuid) to authenticated;
grant execute on function public.remove_member_from_active_ledger_book(uuid) to authenticated;
grant execute on function public.request_ledger_book_join_by_code(text) to authenticated;
grant execute on function public.switch_active_ledger_book(uuid) to authenticated;
grant execute on function public.update_active_ledger_book_name(text) to authenticated;
grant execute on function public.update_own_profile_display_name(text) to authenticated;
