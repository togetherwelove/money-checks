create or replace function private.is_ledger_book_editable_by_current_user(target_book_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  accessible_book_limit integer;
  current_user_id uuid := auth.uid();
  current_user_subscription_tier text := 'free';
  current_member_count integer := 0;
  owner_subscription_tier text := 'free';
  target_access_position integer;
  target_member_limit integer;
  target_owner_id uuid;
begin
  if current_user_id is null or target_book_id is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = target_book_id
      and members.user_id = current_user_id
      and members.role in ('owner', 'editor')
  ) then
    return false;
  end if;

  select coalesce(profiles.subscription_tier, 'free')
  into current_user_subscription_tier
  from public.profiles as profiles
  where profiles.id = current_user_id;

  accessible_book_limit := public.accessible_ledger_book_limit(
    coalesce(current_user_subscription_tier, 'free')
  );

  select ranked_books.access_position
  into target_access_position
  from (
    select
      members.book_id,
      row_number() over (
        order by
          case when books.owner_id = current_user_id then 0 else 1 end,
          books.created_at,
          books.name,
          books.id
      ) as access_position
    from public.ledger_book_members as members
    join public.ledger_books as books
      on books.id = members.book_id
    where members.user_id = current_user_id
  ) as ranked_books
  where ranked_books.book_id = target_book_id;

  if target_access_position is null or target_access_position > accessible_book_limit then
    return false;
  end if;

  select books.owner_id
  into target_owner_id
  from public.ledger_books as books
  where books.id = target_book_id;

  if target_owner_id is null then
    return false;
  end if;

  select coalesce(profiles.subscription_tier, 'free')
  into owner_subscription_tier
  from public.profiles as profiles
  where profiles.id = target_owner_id;

  target_member_limit := public.shared_ledger_member_limit(
    coalesce(owner_subscription_tier, 'free')
  );

  select count(*)
  into current_member_count
  from public.ledger_book_members as members
  where members.book_id = target_book_id;

  return current_member_count <= target_member_limit;
end;
$$;
