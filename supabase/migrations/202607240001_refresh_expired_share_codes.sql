create or replace function private.refresh_active_ledger_book_share_code_if_expired()
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
  current_active_book_id uuid;
  current_book_owner_id uuid;
  current_share_code_expires_at timestamptz;
  refresh_now timestamptz := timezone('utc', now());
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  select profiles.active_book_id
  into current_active_book_id
  from public.profiles as profiles
  where profiles.id = current_user_id;

  if current_active_book_id is null then
    raise exception 'Active ledger book was not found';
  end if;

  select books.owner_id, books.share_code_expires_at
  into current_book_owner_id, current_share_code_expires_at
  from public.ledger_books as books
  where books.id = current_active_book_id
    and exists (
      select 1
      from public.ledger_book_members as members
      where members.book_id = books.id
        and members.user_id = current_user_id
        and members.role in ('owner', 'editor')
    )
  for update;

  if current_book_owner_id is null then
    raise exception 'Active ledger book was not found';
  end if;

  if current_book_owner_id = current_user_id
    and current_share_code_expires_at <= refresh_now then
    update public.ledger_books as books
    set
      share_code = public.generate_share_code(),
      share_code_created_at = refresh_now,
      share_code_expires_at = refresh_now + public.share_code_time_to_live()
    where books.id = current_active_book_id;
  end if;

  return query
  select books.id, books.name, books.owner_id, books.share_code
  from public.ledger_books as books
  where books.id = current_active_book_id;
end;
$$;

create or replace function public.refresh_active_ledger_book_share_code_if_expired()
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.refresh_active_ledger_book_share_code_if_expired();
$$;

revoke all on function private.refresh_active_ledger_book_share_code_if_expired()
  from public, anon;
revoke all on function public.refresh_active_ledger_book_share_code_if_expired()
  from public, anon;

grant execute on function private.refresh_active_ledger_book_share_code_if_expired()
  to authenticated;
grant execute on function public.refresh_active_ledger_book_share_code_if_expired()
  to authenticated;
