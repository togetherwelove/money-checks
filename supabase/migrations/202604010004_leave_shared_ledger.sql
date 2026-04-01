create or replace function public.leave_active_ledger_book()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_book_id uuid;
  current_book_owner_id uuid;
  fallback_book_id uuid;
begin
  select profiles.active_book_id
  into current_book_id
  from public.profiles as profiles
  where profiles.id = auth.uid();

  if current_book_id is null then
    raise exception 'No active ledger book found for user %', auth.uid();
  end if;

  select books.owner_id
  into current_book_owner_id
  from public.ledger_books as books
  where books.id = current_book_id;

  if current_book_owner_id is null then
    raise exception 'Active ledger book % was not found', current_book_id;
  end if;

  fallback_book_id := public.ensure_personal_ledger_book(auth.uid(), '기본 가계부');

  if current_book_owner_id <> auth.uid() then
    delete from public.ledger_book_members
    where book_id = current_book_id
      and user_id = auth.uid();
  end if;

  update public.profiles
  set active_book_id = fallback_book_id
  where id = auth.uid();

  return fallback_book_id;
end;
$$;

grant execute on function public.leave_active_ledger_book() to authenticated;
