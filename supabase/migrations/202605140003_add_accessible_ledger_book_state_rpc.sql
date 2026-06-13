create or replace function private.get_accessible_ledger_book_state()
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text,
  member_role text,
  is_active boolean
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  perform private.ensure_own_personal_ledger_book();

  return query
  select
    books.id,
    books.name,
    books.owner_id,
    books.share_code,
    members.role as member_role,
    profiles.active_book_id = books.id as is_active
  from public.ledger_book_members as members
  join public.ledger_books as books
    on books.id = members.book_id
  join public.profiles as profiles
    on profiles.id = current_user_id
  where members.user_id = current_user_id
  order by
    case when profiles.active_book_id = books.id then 0 else 1 end,
    case when books.owner_id = current_user_id then 0 else 1 end,
    books.created_at,
    books.name;
end;
$$;

create or replace function public.get_accessible_ledger_book_state()
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text,
  member_role text,
  is_active boolean
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_accessible_ledger_book_state();
$$;

revoke all on function public.get_accessible_ledger_book_state() from public, anon;
revoke all on function private.get_accessible_ledger_book_state() from public, anon;

grant execute on function public.get_accessible_ledger_book_state() to authenticated;
grant execute on function private.get_accessible_ledger_book_state() to authenticated;
