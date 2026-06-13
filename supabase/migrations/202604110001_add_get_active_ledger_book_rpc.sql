create or replace function public.get_active_ledger_book()
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  next_active_book_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = current_user_id
  ) then
    insert into public.profiles (id)
    values (current_user_id);
  end if;

  select profile.active_book_id
  into next_active_book_id
  from public.profiles as profile
  where profile.id = current_user_id;

  if next_active_book_id is null then
    next_active_book_id := public.ensure_own_personal_ledger_book();
  end if;

  return query
  select book.id, book.name, book.owner_id, book.share_code
  from public.get_accessible_ledger_book(next_active_book_id) as book;
end;
$$;

revoke all on function public.get_active_ledger_book() from public;
grant execute on function public.get_active_ledger_book() to authenticated;
