alter table public.ledger_book_join_requests
drop constraint if exists ledger_book_join_requests_join_resolution_check;

alter table public.ledger_book_join_requests
add constraint ledger_book_join_requests_join_resolution_check
check (
  join_resolution in (
    'standard',
    'merge_personal_book_on_approval',
    'discard_personal_book_on_approval'
  )
);

create or replace function private.discard_owned_personal_ledger_books_before_join(
  source_owner_id uuid,
  target_book_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if source_owner_id is null or target_book_id is null then
    raise exception 'Source owner and target book are required';
  end if;

  if not private.can_merge_owned_personal_ledger_books_into_target(
    source_owner_id,
    target_book_id
  ) then
    raise exception using
      message = 'Only personal ledgers can be discarded automatically.',
      detail = 'Shared ledgers with other members must be handled manually.';
  end if;

  delete from public.ledger_books as books
  where books.owner_id = source_owner_id
    and books.id <> target_book_id;
end;
$$;

create or replace function private.resolve_ledger_book_join_approval_status(
  target_requester_user_id uuid,
  target_book_id uuid,
  requested_join_resolution text default 'standard'
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  accessible_book_count integer := 0;
  accessible_book_limit integer;
  requester_subscription_tier text := 'free';
begin
  if target_requester_user_id is null or target_book_id is null then
    return 'blocked_accessible_limit';
  end if;

  if exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = target_book_id
      and members.user_id = target_requester_user_id
  ) then
    return 'can_approve';
  end if;

  if public.is_ledger_book_member_limit_reached(target_book_id) then
    return 'blocked_target_member_limit';
  end if;

  select coalesce(profiles.subscription_tier, 'free')
  into requester_subscription_tier
  from public.profiles as profiles
  where profiles.id = target_requester_user_id;

  accessible_book_limit := public.accessible_ledger_book_limit(
    coalesce(requester_subscription_tier, 'free')
  );

  select count(*)
  into accessible_book_count
  from public.ledger_book_members as members
  where members.user_id = target_requester_user_id;

  if accessible_book_count < accessible_book_limit then
    return 'can_approve';
  end if;

  if requester_subscription_tier = 'free' and accessible_book_limit = 1 then
    if exists (
      select 1
      from public.ledger_book_members as own_membership
      join public.ledger_books as books
        on books.id = own_membership.book_id
      where own_membership.user_id = target_requester_user_id
        and own_membership.book_id <> target_book_id
        and own_membership.role = 'owner'
        and exists (
          select 1
          from public.ledger_book_members as other_members
          where other_members.book_id = own_membership.book_id
            and other_members.user_id <> target_requester_user_id
        )
    ) then
      return 'blocked_shared_owner_free';
    end if;

    if exists (
      select 1
      from public.ledger_book_members as memberships
      where memberships.user_id = target_requester_user_id
        and memberships.book_id <> target_book_id
        and memberships.role <> 'owner'
    ) then
      return 'blocked_shared_editor_free';
    end if;

    if private.can_merge_owned_personal_ledger_books_into_target(
      target_requester_user_id,
      target_book_id
    ) then
      if requested_join_resolution = 'merge_personal_book_on_approval' then
        return 'can_approve_with_personal_book_merge';
      end if;

      if requested_join_resolution = 'discard_personal_book_on_approval' then
        return 'can_approve_with_personal_book_discard';
      end if;

      return 'needs_personal_book_merge_confirmation';
    end if;
  end if;

  return 'blocked_accessible_limit';
end;
$$;

create or replace function private.request_ledger_book_join_by_code(
  input_code text,
  join_resolution text default 'standard'
)
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
  approval_status text;
  effective_join_resolution text := 'standard';
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if join_resolution not in (
    'standard',
    'merge_personal_book_on_approval',
    'discard_personal_book_on_approval'
  ) then
    raise exception 'Unsupported join resolution %', join_resolution;
  end if;

  if not public.try_acquire_function_invocation_lock(
    'request-ledger-book-join-by-code:' || current_user_id::text,
    interval '3 seconds'
  ) then
    raise exception using
      message = 'Join request was invoked too recently.',
      detail = 'Please wait before trying another share code.';
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

  approval_status := private.resolve_ledger_book_join_approval_status(
    current_user_id,
    target_book_id,
    join_resolution
  );

  if approval_status not in (
    'can_approve',
    'can_approve_with_personal_book_merge',
    'can_approve_with_personal_book_discard'
  ) then
    perform private.raise_ledger_book_join_not_allowed(approval_status);
  end if;

  if approval_status = 'can_approve_with_personal_book_merge' then
    effective_join_resolution := 'merge_personal_book_on_approval';
  end if;

  if approval_status = 'can_approve_with_personal_book_discard' then
    effective_join_resolution := 'discard_personal_book_on_approval';
  end if;

  insert into public.ledger_book_join_requests (
    book_id,
    requester_user_id,
    status,
    join_resolution,
    created_at,
    reviewed_at,
    reviewed_by
  )
  values (
    target_book_id,
    current_user_id,
    'pending',
    effective_join_resolution,
    request_now,
    null,
    null
  )
  on conflict (book_id, requester_user_id) do update
    set status = 'pending',
        join_resolution = excluded.join_resolution,
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
  request_join_resolution text := 'standard';
  requester_is_already_member boolean := false;
  approval_status text;
begin
  select requests.book_id, requests.requester_user_id, requests.join_resolution
  into request_book_id, request_user_id, request_join_resolution
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

    approval_status := private.resolve_ledger_book_join_approval_status(
      request_user_id,
      request_book_id,
      request_join_resolution
    );

    if approval_status = 'can_approve_with_personal_book_merge' then
      perform private.merge_owned_ledger_books_into_target(request_user_id, request_book_id);
    elsif approval_status = 'can_approve_with_personal_book_discard' then
      perform private.discard_owned_personal_ledger_books_before_join(
        request_user_id,
        request_book_id
      );
    elsif approval_status <> 'can_approve' then
      perform private.raise_ledger_book_join_not_allowed(approval_status);
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
