create or replace function public.remove_member_from_active_ledger_book(target_user_id uuid)
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
  if target_user_id = auth.uid() then
    raise exception 'Owner cannot remove themselves with remove_member_from_active_ledger_book';
  end if;

  select profiles.active_book_id
  into current_book_id
  from public.profiles as profiles
  where profiles.id = auth.uid();

  if current_book_id is null then
    raise exception 'No active ledger book found for owner %', auth.uid();
  end if;

  select books.owner_id
  into current_book_owner_id
  from public.ledger_books as books
  where books.id = current_book_id;

  if current_book_owner_id <> auth.uid() then
    raise exception 'Only the active book owner can remove members';
  end if;

  delete from public.ledger_book_members
  where book_id = current_book_id
    and user_id = target_user_id
    and role <> 'owner';

  fallback_book_id := public.ensure_personal_ledger_book(target_user_id, '기본 가계부');

  update public.profiles
  set active_book_id = fallback_book_id
  where id = target_user_id
    and active_book_id = current_book_id;

  return current_book_id;
end;
$$;

grant execute on function public.remove_member_from_active_ledger_book(uuid) to authenticated;
