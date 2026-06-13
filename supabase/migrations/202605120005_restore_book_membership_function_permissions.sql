grant usage on schema private to authenticated;

grant execute on function public.is_book_member(uuid) to authenticated;
grant execute on function public.is_book_editor(uuid) to authenticated;
grant execute on function public.is_book_owner(uuid) to authenticated;

grant execute on function private.is_book_member(uuid) to authenticated;
grant execute on function private.is_book_editor(uuid) to authenticated;
grant execute on function private.is_book_owner(uuid) to authenticated;
