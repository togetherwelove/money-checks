grant usage on schema private to authenticated;
grant execute on function private.update_own_profile_default_currency(text) to authenticated;
grant execute on function public.update_own_profile_default_currency(text) to authenticated;
