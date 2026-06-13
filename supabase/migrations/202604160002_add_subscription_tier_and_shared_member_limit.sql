alter table public.profiles
add column if not exists subscription_tier text not null default 'free'
check (subscription_tier in ('free', 'plus'));

update public.profiles
set subscription_tier = 'free'
where subscription_tier is null;

create or replace function public.free_shared_ledger_member_limit()
returns integer
language sql
immutable
as $$
  select 2;
$$;

create or replace function public.is_ledger_book_member_limit_reached(target_book_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  current_member_count integer := 0;
  owner_subscription_tier text := 'free';
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

  if owner_subscription_tier = 'plus' then
    return false;
  end if;

  select count(*)
  into current_member_count
  from public.ledger_book_members as members
  where members.book_id = target_book_id;

  return current_member_count >= public.free_shared_ledger_member_limit();
end;
$$;

create or replace function public.request_ledger_book_join_by_code(input_code text)
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
  current_active_book_id uuid;
  existing_request_status text;
  existing_request_created_at timestamptz;
  existing_request_reviewed_at timestamptz;
begin
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

  if target_owner_id = auth.uid() then
    update public.profiles
    set active_book_id = target_book_id
    where id = auth.uid();

    return 'joined';
  end if;

  if exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = target_book_id
      and members.user_id = auth.uid()
  ) then
    update public.profiles
    set active_book_id = target_book_id
    where id = auth.uid();

    return 'joined';
  end if;

  if public.is_ledger_book_member_limit_reached(target_book_id) then
    raise exception using
      message = 'Shared ledger member limit reached for owner subscription tier.',
      detail = 'Free plan ledger books can only have two total members.';
  end if;

  select profiles.active_book_id
  into current_active_book_id
  from public.profiles as profiles
  where profiles.id = auth.uid();

  if current_active_book_id is not null
    and current_active_book_id <> target_book_id
    and exists (
      select 1
      from public.ledger_book_members as members
      where members.book_id = current_active_book_id
        and members.user_id = auth.uid()
        and members.role in ('owner', 'editor')
    )
    and exists (
      select 1
      from public.ledger_book_members as members
      where members.book_id = current_active_book_id
        and members.user_id <> auth.uid()
    ) then
    raise exception using
      message = 'Active shared ledger editors cannot request another shared ledger.',
      detail = 'Leave your current shared ledger before requesting a different one.';
  end if;

  select requests.status, requests.created_at, requests.reviewed_at
  into existing_request_status, existing_request_created_at, existing_request_reviewed_at
  from public.ledger_book_join_requests as requests
  where requests.book_id = target_book_id
    and requests.requester_user_id = auth.uid();

  if existing_request_status = 'pending'
    and existing_request_created_at > request_now - public.join_request_pending_cooldown() then
    raise exception using
      message = 'A join request is already pending.',
      detail = 'Please wait before sending the same join request again.';
  end if;

  if existing_request_status in ('approved', 'rejected')
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
    auth.uid(),
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

create or replace function public.approve_ledger_book_join_request(target_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_book_id uuid;
  request_user_id uuid;
begin
  select requests.book_id, requests.requester_user_id
  into request_book_id, request_user_id
  from public.ledger_book_join_requests as requests
  where requests.id = target_request_id
    and requests.status = 'pending';

  if request_book_id is null or request_user_id is null then
    raise exception 'Pending join request % was not found', target_request_id;
  end if;

  if not public.is_book_owner(request_book_id) then
    raise exception 'Only the book owner can approve join requests';
  end if;

  if public.is_ledger_book_member_limit_reached(request_book_id) then
    raise exception using
      message = 'Shared ledger member limit reached for owner subscription tier.',
      detail = 'Free plan ledger books can only have two total members.';
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

revoke all on function public.free_shared_ledger_member_limit() from public;
revoke all on function public.is_ledger_book_member_limit_reached(uuid) from public;

grant execute on function public.free_shared_ledger_member_limit() to authenticated;
grant execute on function public.is_ledger_book_member_limit_reached(uuid) to authenticated;
