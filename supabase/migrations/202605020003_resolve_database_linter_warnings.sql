create schema if not exists extensions;

grant usage on schema extensions to anon, authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    alter extension pg_trgm set schema extensions;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'net') then
    execute 'revoke usage on schema net from public, anon, authenticated';
  end if;
end $$;

alter function public.get_ledger_widget_summary(uuid, date, integer)
set search_path = public;

alter function public.free_owned_ledger_book_limit()
set search_path = public;

alter function public.plus_owned_ledger_book_limit()
set search_path = public;

alter function public.owned_ledger_book_limit(text)
set search_path = public;

alter function public.free_shared_ledger_member_limit()
set search_path = public;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;

revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.ensure_personal_ledger_book(uuid, text) from authenticated;
revoke execute on function public.join_ledger_book_by_code(text) from authenticated;
revoke execute on function public.free_shared_ledger_member_limit() from authenticated;
revoke execute on function public.is_ledger_book_member_limit_reached(uuid) from authenticated;
revoke execute on function public.free_owned_ledger_book_limit() from authenticated;
revoke execute on function public.plus_owned_ledger_book_limit() from authenticated;
revoke execute on function public.owned_ledger_book_limit(text) from authenticated;
revoke execute on function public.try_acquire_function_invocation_lock(text, interval) from authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc as procedures
    join pg_namespace as namespaces
      on namespaces.oid = procedures.pronamespace
    where namespaces.nspname = 'public'
      and procedures.proname = 'rls_auto_enable'
      and procedures.pronargs = 0
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;

grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.is_book_member(uuid) to authenticated;
grant execute on function public.is_book_editor(uuid) to authenticated;
grant execute on function public.is_book_owner(uuid) to authenticated;

grant execute on function public.ensure_own_personal_ledger_book() to authenticated;
grant execute on function public.get_accessible_ledger_book(uuid) to authenticated;
grant execute on function public.get_accessible_ledger_books() to authenticated;
grant execute on function public.get_active_ledger_book() to authenticated;
grant execute on function public.get_ledger_book_members(uuid) to authenticated;
grant execute on function public.get_pending_ledger_book_join_requests(uuid) to authenticated;
grant execute on function public.request_ledger_book_join_by_code(text) to authenticated;
grant execute on function public.approve_ledger_book_join_request(uuid) to authenticated;
grant execute on function public.reject_ledger_book_join_request(uuid) to authenticated;
grant execute on function public.leave_active_ledger_book() to authenticated;
grant execute on function public.remove_member_from_active_ledger_book(uuid) to authenticated;
grant execute on function public.create_owned_ledger_book(text) to authenticated;
grant execute on function public.switch_active_ledger_book(uuid) to authenticated;
grant execute on function public.update_active_ledger_book_name(text) to authenticated;
grant execute on function public.update_own_profile_display_name(text) to authenticated;
grant execute on function public.get_ledger_widget_summary(uuid, date, integer) to authenticated;

grant execute on function public.try_acquire_function_invocation_lock(text, interval) to service_role;
