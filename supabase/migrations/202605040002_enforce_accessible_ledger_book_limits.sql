create or replace function public.plus_shared_ledger_member_limit()
returns integer
language sql
immutable
set search_path = public
as $$
  select 5;
$$;

create or replace function public.shared_ledger_member_limit(target_subscription_tier text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
    when target_subscription_tier = 'plus' then public.plus_shared_ledger_member_limit()
    else public.free_shared_ledger_member_limit()
  end;
$$;

create or replace function public.free_accessible_ledger_book_limit()
returns integer
language sql
immutable
set search_path = public
as $$
  select 1;
$$;

create or replace function public.plus_accessible_ledger_book_limit()
returns integer
language sql
immutable
set search_path = public
as $$
  select 3;
$$;

create or replace function public.accessible_ledger_book_limit(target_subscription_tier text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
    when target_subscription_tier = 'plus' then public.plus_accessible_ledger_book_limit()
    else public.free_accessible_ledger_book_limit()
  end;
$$;

create or replace function public.is_accessible_ledger_book_limit_reached(target_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  accessible_book_count integer := 0;
  target_subscription_tier text := 'free';
begin
  select coalesce(profiles.subscription_tier, 'free')
  into target_subscription_tier
  from public.profiles as profiles
  where profiles.id = target_user_id;

  select count(*)
  into accessible_book_count
  from public.ledger_book_members as members
  where members.user_id = target_user_id;

  return accessible_book_count >= public.accessible_ledger_book_limit(
    coalesce(target_subscription_tier, 'free')
  );
end;
$$;

create or replace function public.is_ledger_book_member_limit_reached(target_book_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_member_count integer := 0;
  owner_subscription_tier text := 'free';
  target_member_limit integer;
  target_owner_id uuid;
begin
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

  return current_member_count >= target_member_limit;
end;
$$;

create or replace function private.create_owned_ledger_book(next_name text)
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
  accessible_book_count integer := 0;
  accessible_book_limit integer;
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
  on conflict on constraint profiles_pkey do nothing;

  select coalesce(profiles.subscription_tier, 'free')
  into profile_subscription_tier
  from public.profiles as profiles
  where profiles.id = current_user_id
  for update;

  owned_book_limit := public.owned_ledger_book_limit(profile_subscription_tier);
  accessible_book_limit := public.accessible_ledger_book_limit(profile_subscription_tier);

  select count(*)
  into owned_book_count
  from public.ledger_books as books
  where books.owner_id = current_user_id;

  if owned_book_count >= owned_book_limit then
    raise exception using
      message = 'Owned ledger book limit reached for subscription tier.',
      detail = 'Free users can own one ledger book and plus users can own three ledger books.';
  end if;

  select count(*)
  into accessible_book_count
  from public.ledger_book_members as members
  where members.user_id = current_user_id;

  if accessible_book_count >= accessible_book_limit then
    raise exception using
      message = 'Accessible ledger book limit reached for subscription tier.',
      detail = 'Free users can access one ledger book and plus users can access three ledger books.';
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

create or replace function private.request_ledger_book_join_by_code(input_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  request_now timestamptz := timezone('utc', now());
  target_book_id uuid;
  target_owner_id uuid;
  target_share_code_expires_at timestamptz;
  current_user_id uuid := auth.uid();
  existing_request_status text;
  existing_request_created_at timestamptz;
  existing_request_reviewed_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  normalized_code := upper(trim(input_code));

  select books.id, books.owner_id, books.share_code_expires_at
  into target_book_id, target_owner_id, target_share_code_expires_at
  from public.ledger_books as books
  where books.share_code = normalized_code;

  if target_book_id is null then
    raise exception 'Ledger book not found for code %', normalized_code;
  end if;

  if target_share_code_expires_at <= request_now then
    raise exception using
      message = 'This share code has expired.',
      detail = 'Ask the owner for a freshly rotated code.';
  end if;

  if target_owner_id = current_user_id then
    update public.profiles
    set active_book_id = target_book_id
    where id = current_user_id;

    return 'joined';
  end if;

  if exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = target_book_id
      and members.user_id = current_user_id
  ) then
    update public.profiles
    set active_book_id = target_book_id
    where id = current_user_id;

    return 'joined';
  end if;

  insert into public.profiles (id)
  values (current_user_id)
  on conflict on constraint profiles_pkey do nothing;

  if public.is_accessible_ledger_book_limit_reached(current_user_id) then
    raise exception using
      message = 'Accessible ledger book limit reached for subscription tier.',
      detail = 'Free users can access one ledger book and plus users can access three ledger books.';
  end if;

  if public.is_ledger_book_member_limit_reached(target_book_id) then
    raise exception using
      message = 'Shared ledger member limit reached for owner subscription tier.',
      detail = 'Free plan ledger books can have two total members and plus plan ledger books can have five total members.';
  end if;

  select requests.status, requests.created_at, requests.reviewed_at
  into existing_request_status, existing_request_created_at, existing_request_reviewed_at
  from public.ledger_book_join_requests as requests
  where requests.book_id = target_book_id
    and requests.requester_user_id = current_user_id;

  if existing_request_status = 'pending'
    and existing_request_created_at > request_now - public.join_request_pending_cooldown() then
    raise exception using
      message = 'A join request is already pending.',
      detail = 'Please wait before sending the same join request again.';
  end if;

  if existing_request_status = 'approved'
    and coalesce(existing_request_reviewed_at, existing_request_created_at) >
      request_now - public.join_request_retry_cooldown() then
    raise exception using
      message = 'This join request is cooling down.',
      detail = 'Please wait before requesting access again.';
  end if;

  insert into public.ledger_book_join_requests (
    book_id,
    requester_user_id,
    status,
    created_at,
    reviewed_at,
    reviewed_by
  )
  values (
    target_book_id,
    current_user_id,
    'pending',
    request_now,
    null,
    null
  )
  on conflict (book_id, requester_user_id) do update
    set status = 'pending',
        created_at = excluded.created_at,
        reviewed_at = null,
        reviewed_by = null;

  return 'requested';
end;
$$;

create or replace function private.approve_ledger_book_join_request(target_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_book_id uuid;
  request_user_id uuid;
  requester_is_already_member boolean := false;
begin
  select requests.book_id, requests.requester_user_id
  into request_book_id, request_user_id
  from public.ledger_book_join_requests as requests
  where requests.id = target_request_id
    and requests.status = 'pending';

  if request_book_id is null or request_user_id is null then
    raise exception 'Pending join request % was not found', target_request_id;
  end if;

  if not private.is_book_owner(request_book_id) then
    raise exception 'Only the book owner can approve join requests';
  end if;

  select exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = request_book_id
      and members.user_id = request_user_id
  )
  into requester_is_already_member;

  if not requester_is_already_member then
    insert into public.profiles (id)
    values (request_user_id)
    on conflict on constraint profiles_pkey do nothing;

    perform 1
    from public.profiles as profiles
    where profiles.id = request_user_id
    for update;

    if public.is_accessible_ledger_book_limit_reached(request_user_id) then
      raise exception using
        message = 'Accessible ledger book limit reached for subscription tier.',
        detail = 'Free users can access one ledger book and plus users can access three ledger books.';
    end if;

    if public.is_ledger_book_member_limit_reached(request_book_id) then
      raise exception using
        message = 'Shared ledger member limit reached for owner subscription tier.',
        detail = 'Free plan ledger books can have two total members and plus plan ledger books can have five total members.';
    end if;
  end if;

  insert into public.ledger_book_members (book_id, user_id, role)
  values (request_book_id, request_user_id, 'editor')
  on conflict (book_id, user_id) do nothing;

  update public.profiles
  set active_book_id = request_book_id
  where id = request_user_id;

  update public.ledger_book_join_requests
  set status = 'approved',
      reviewed_at = timezone('utc', now()),
      reviewed_by = auth.uid()
  where id = target_request_id;

  return request_book_id;
end;
$$;

with ranked_access as (
  select
    members.book_id,
    members.user_id,
    books.owner_id,
    row_number() over (
      partition by members.user_id
      order by
        case when profiles.active_book_id = members.book_id then 0 else 1 end,
        case when books.owner_id = members.user_id then 0 else 1 end,
        books.created_at,
        books.id
    ) as access_rank,
    public.accessible_ledger_book_limit(coalesce(profiles.subscription_tier, 'free')) as access_limit
  from public.ledger_book_members as members
  join public.ledger_books as books
    on books.id = members.book_id
  left join public.profiles as profiles
    on profiles.id = members.user_id
)
delete from public.ledger_books as books
using ranked_access as ranked
where books.id = ranked.book_id
  and ranked.owner_id = ranked.user_id
  and ranked.access_rank > ranked.access_limit;

with ranked_access as (
  select
    members.book_id,
    members.user_id,
    books.owner_id,
    row_number() over (
      partition by members.user_id
      order by
        case when profiles.active_book_id = members.book_id then 0 else 1 end,
        case when books.owner_id = members.user_id then 0 else 1 end,
        books.created_at,
        books.id
    ) as access_rank,
    public.accessible_ledger_book_limit(coalesce(profiles.subscription_tier, 'free')) as access_limit
  from public.ledger_book_members as members
  join public.ledger_books as books
    on books.id = members.book_id
  left join public.profiles as profiles
    on profiles.id = members.user_id
)
delete from public.ledger_book_members as members
using ranked_access as ranked
where members.book_id = ranked.book_id
  and members.user_id = ranked.user_id
  and ranked.owner_id <> ranked.user_id
  and ranked.access_rank > ranked.access_limit;

with ranked_book_members as (
  select
    members.book_id,
    members.user_id,
    books.owner_id,
    row_number() over (
      partition by members.book_id
      order by
        case when members.user_id = books.owner_id then 0 else 1 end,
        members.created_at,
        members.user_id
    ) as member_rank,
    public.shared_ledger_member_limit(coalesce(owner_profiles.subscription_tier, 'free')) as member_limit
  from public.ledger_book_members as members
  join public.ledger_books as books
    on books.id = members.book_id
  left join public.profiles as owner_profiles
    on owner_profiles.id = books.owner_id
)
delete from public.ledger_book_members as members
using ranked_book_members as ranked
where members.book_id = ranked.book_id
  and members.user_id = ranked.user_id
  and ranked.user_id <> ranked.owner_id
  and ranked.member_rank > ranked.member_limit;

update public.profiles as profiles
set active_book_id = null
where profiles.active_book_id is not null
  and not exists (
    select 1
    from public.ledger_book_members as members
    where members.user_id = profiles.id
      and members.book_id = profiles.active_book_id
  );

update public.profiles as profiles
set active_book_id = (
  select members.book_id
  from public.ledger_book_members as members
  join public.ledger_books as books
    on books.id = members.book_id
  where members.user_id = profiles.id
  order by
    case when books.owner_id = profiles.id then 0 else 1 end,
    books.created_at,
    books.id
  limit 1
)
where profiles.active_book_id is null
  and exists (
    select 1
    from public.ledger_book_members as members
    where members.user_id = profiles.id
  );

revoke all on function public.plus_shared_ledger_member_limit() from public, anon, authenticated;
revoke all on function public.shared_ledger_member_limit(text) from public, anon, authenticated;
revoke all on function public.free_accessible_ledger_book_limit() from public, anon, authenticated;
revoke all on function public.plus_accessible_ledger_book_limit() from public, anon, authenticated;
revoke all on function public.accessible_ledger_book_limit(text) from public, anon, authenticated;
revoke all on function public.is_accessible_ledger_book_limit_reached(uuid) from public, anon, authenticated;
revoke all on function public.is_ledger_book_member_limit_reached(uuid) from public, anon, authenticated;
