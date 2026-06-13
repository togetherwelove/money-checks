grant usage on schema private to authenticated;

grant execute on function public.get_accessible_ledger_book(uuid) to authenticated;
grant execute on function public.get_accessible_ledger_books() to authenticated;
grant execute on function public.get_active_ledger_book() to authenticated;

grant execute on function private.get_accessible_ledger_book(uuid) to authenticated;
grant execute on function private.get_accessible_ledger_books() to authenticated;
grant execute on function private.get_active_ledger_book() to authenticated;
