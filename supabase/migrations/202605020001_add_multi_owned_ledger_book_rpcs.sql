create or replace function public.free_owned_ledger_book_limit()
returns integer
language sql
immutable
as $$
  select 1;
$$;

create or replace function public.plus_owned_ledger_book_limit()
returns integer
language sql
immutable
as $$
  select 3;
$$;

create or replace function public.owned_ledger_book_limit(target_subscription_tier text)
returns integer
language sql
immutable
as $$
  select case
    when target_subscription_tier = 'plus' then public.plus_owned_ledger_book_limit()
    else public.free_owned_ledger_book_limit()
  end;
$$;

create or replace function public.get_accessible_ledger_books()
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text,
  member_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  return query
  select
    books.id,
    books.name,
    books.owner_id,
    books.share_code,
    members.role as member_role
  from public.ledger_book_members as members
  join public.ledger_books as books
    on books.id = members.book_id
  where members.user_id = current_user_id
  order by
    case when books.owner_id = current_user_id then 0 else 1 end,
    books.created_at,
    books.name;
end;
$$;

create or replace function public.create_owned_ledger_book(next_name text)
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
  created_at_value timestamptz := timezone('utc', now());
  normalized_name text;
  owned_book_count integer := 0;
  owned_book_limit integer;
  profile_subscription_tier text := 'free';
  next_book_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  normalized_name := regexp_replace(trim(coalesce(next_name, '')), '\s+', ' ', 'g');

  if normalized_name = '' then
    raise exception 'Ledger book name is required';
  end if;

  insert into public.profiles (id)
  values (current_user_id)
  on conflict (id) do nothing;

  select coalesce(profiles.subscription_tier, 'free')
  into profile_subscription_tier
  from public.profiles as profiles
  where profiles.id = current_user_id
  for update;

  owned_book_limit := public.owned_ledger_book_limit(profile_subscription_tier);

  select count(*)
  into owned_book_count
  from public.ledger_books as books
  where books.owner_id = current_user_id;

  if owned_book_count >= owned_book_limit then
    raise exception using
      message = 'Owned ledger book limit reached for subscription tier.',
      detail = 'Free users can own one ledger book and plus users can own three ledger books.';
  end if;

  insert into public.ledger_books (
    owner_id,
    name,
    share_code,
    share_code_created_at,
    share_code_expires_at
  )
  values (
    current_user_id,
    normalized_name,
    public.generate_share_code(),
    created_at_value,
    created_at_value + public.share_code_time_to_live()
  )
  returning ledger_books.id into next_book_id;

  insert into public.ledger_book_members (book_id, user_id, role)
  values (next_book_id, current_user_id, 'owner')
  on conflict (book_id, user_id) do nothing;

  update public.profiles
  set active_book_id = next_book_id
  where public.profiles.id = current_user_id;

  return query
  select books.id, books.name, books.owner_id, books.share_code
  from public.ledger_books as books
  where books.id = next_book_id;
end;
$$;

create or replace function public.switch_active_ledger_book(target_book_id uuid)
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
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if not exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = target_book_id
      and members.user_id = current_user_id
  ) then
    raise exception 'Ledger book % is not accessible to user %', target_book_id, current_user_id;
  end if;

  insert into public.profiles (id)
  values (current_user_id)
  on conflict (id) do nothing;

  update public.profiles
  set active_book_id = target_book_id
  where public.profiles.id = current_user_id;

  return query
  select book.id, book.name, book.owner_id, book.share_code
  from public.get_accessible_ledger_book(target_book_id) as book;
end;
$$;

revoke all on function public.free_owned_ledger_book_limit() from public;
revoke all on function public.plus_owned_ledger_book_limit() from public;
revoke all on function public.owned_ledger_book_limit(text) from public;
revoke all on function public.get_accessible_ledger_books() from public;
revoke all on function public.create_owned_ledger_book(text) from public;
revoke all on function public.switch_active_ledger_book(uuid) from public;

grant execute on function public.free_owned_ledger_book_limit() to authenticated;
grant execute on function public.plus_owned_ledger_book_limit() to authenticated;
grant execute on function public.owned_ledger_book_limit(text) to authenticated;
grant execute on function public.get_accessible_ledger_books() to authenticated;
grant execute on function public.create_owned_ledger_book(text) to authenticated;
grant execute on function public.switch_active_ledger_book(uuid) to authenticated;
