create or replace function public.join_ledger_book_by_code(input_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if input_code is null then
    null;
  end if;

  raise exception using
    message = 'Direct shared ledger joins are disabled.',
    detail = 'Join requests now require owner approval.',
    hint = 'Call public.request_ledger_book_join_by_code(text) instead.';
end;
$$;

revoke execute on function public.join_ledger_book_by_code(text) from public, anon, authenticated;
