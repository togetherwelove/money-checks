create or replace function private.transfer_ledger_book_ownership(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_active_book_id uuid;
  current_book_owner_id uuid;
  current_user_id uuid := auth.uid();
  target_member_role text;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if target_user_id is null then
    raise exception 'Target user is required';
  end if;

  if target_user_id = current_user_id then
    raise exception 'Owner cannot transfer ownership to themselves';
  end if;

  select profiles.active_book_id
  into current_active_book_id
  from public.profiles as profiles
  where profiles.id = current_user_id;

  if current_active_book_id is null then
    raise exception 'No active ledger book found for owner %', current_user_id;
  end if;

  select books.owner_id
  into current_book_owner_id
  from public.ledger_books as books
  where books.id = current_active_book_id
  for update;

  if current_book_owner_id is null then
    raise exception 'Active ledger book was not found';
  end if;

  if current_book_owner_id <> current_user_id then
    raise exception 'Only the active book owner can transfer ownership';
  end if;

  select members.role
  into target_member_role
  from public.ledger_book_members as members
  where members.book_id = current_active_book_id
    and members.user_id = target_user_id
  for update;

  if target_member_role is null then
    raise exception 'Target user is not a member of the active ledger book';
  end if;

  if target_member_role <> 'editor' then
    raise exception 'Ownership can only be transferred to an editor';
  end if;

  update public.ledger_books
  set owner_id = target_user_id
  where id = current_active_book_id;

  update public.ledger_book_members
  set role = 'editor'
  where book_id = current_active_book_id
    and user_id = current_user_id;

  update public.ledger_book_members
  set role = 'owner'
  where book_id = current_active_book_id
    and user_id = target_user_id;

  return current_active_book_id;
end;
$$;

create or replace function public.transfer_ledger_book_ownership(target_user_id uuid)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.transfer_ledger_book_ownership(target_user_id);
$$;

revoke all on function public.transfer_ledger_book_ownership(uuid) from public, anon;
revoke all on function private.transfer_ledger_book_ownership(uuid) from public, anon;

grant execute on function public.transfer_ledger_book_ownership(uuid) to authenticated;
grant execute on function private.transfer_ledger_book_ownership(uuid) to authenticated;
