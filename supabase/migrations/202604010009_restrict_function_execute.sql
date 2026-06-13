revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.ensure_personal_ledger_book(uuid, text) from public;
revoke all on function public.is_book_member(uuid) from public;
revoke all on function public.is_book_editor(uuid) from public;
revoke all on function public.join_ledger_book_by_code(text) from public;
revoke all on function public.leave_active_ledger_book() from public;
revoke all on function public.remove_member_from_active_ledger_book(uuid) from public;
revoke all on function public.can_view_profile(uuid) from public;
revoke all on function public.resolve_profile_display_name(jsonb, text) from public;
revoke all on function public.get_ledger_book_members(uuid) from public;

grant execute on function public.is_book_member(uuid) to authenticated;
grant execute on function public.is_book_editor(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.join_ledger_book_by_code(text) to authenticated;
grant execute on function public.leave_active_ledger_book() to authenticated;
grant execute on function public.remove_member_from_active_ledger_book(uuid) to authenticated;
grant execute on function public.get_ledger_book_members(uuid) to authenticated;
