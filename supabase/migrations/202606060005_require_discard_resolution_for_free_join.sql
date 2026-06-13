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
  normalized_join_resolution text := coalesce(requested_join_resolution, 'standard');
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

    if private.can_discard_owned_personal_ledger_books_before_join(
      target_requester_user_id,
      target_book_id
    ) then
      if normalized_join_resolution = 'discard_personal_book_on_approval' then
        return 'can_approve_with_personal_book_discard';
      end if;

      return 'blocked_accessible_limit';
    end if;
  end if;

  return 'blocked_accessible_limit';
end;
$$;

create or replace function private.preview_ledger_book_join_by_code(input_code text)
returns table (
  status text,
  target_book_id uuid,
  target_book_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  preview_now timestamptz := timezone('utc', now());
  target_owner_id uuid;
  target_share_code_expires_at timestamptz;
  current_user_id uuid := auth.uid();
  existing_request_status text;
  existing_request_created_at timestamptz;
  existing_request_reviewed_at timestamptz;
  approval_status text;
  discard_approval_status text;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if not public.try_acquire_function_invocation_lock(
    'preview-ledger-book-join-by-code:' || current_user_id::text,
    interval '2 seconds'
  ) then
    raise exception using
      message = 'Join preview was invoked too recently.',
      detail = 'Please wait before trying another share code.';
  end if;

  normalized_code := upper(trim(input_code));

  select books.id, books.name, books.owner_id, books.share_code_expires_at
  into target_book_id, target_book_name, target_owner_id, target_share_code_expires_at
  from public.ledger_books as books
  where books.share_code = normalized_code;

  if target_book_id is null then
    return query select 'invalid_code'::text, null::uuid, null::text;
    return;
  end if;

  if target_share_code_expires_at <= preview_now then
    return query select 'expired_code'::text, target_book_id, target_book_name;
    return;
  end if;

  if target_owner_id = current_user_id then
    return query select 'own_book'::text, target_book_id, target_book_name;
    return;
  end if;

  if exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = target_book_id
      and members.user_id = current_user_id
  ) then
    return query select 'already_member'::text, target_book_id, target_book_name;
    return;
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
    and existing_request_created_at > preview_now - public.join_request_time_to_live() then
    return query select 'pending_request'::text, target_book_id, target_book_name;
    return;
  end if;

  if existing_request_status in ('approved', 'rejected')
    and coalesce(existing_request_reviewed_at, existing_request_created_at) >
      preview_now - public.join_request_retry_cooldown() then
    return query select 'join_cooldown'::text, target_book_id, target_book_name;
    return;
  end if;

  approval_status := private.resolve_ledger_book_join_approval_status(
    current_user_id,
    target_book_id,
    'standard'
  );

  if approval_status = 'can_approve' then
    return query select 'can_request'::text, target_book_id, target_book_name;
    return;
  end if;

  if approval_status = 'blocked_accessible_limit' then
    discard_approval_status := private.resolve_ledger_book_join_approval_status(
      current_user_id,
      target_book_id,
      'discard_personal_book_on_approval'
    );

    if discard_approval_status = 'can_approve_with_personal_book_discard' then
      return query select 'can_request_with_personal_book_discard'::text, target_book_id, target_book_name;
      return;
    end if;
  end if;

  return query select approval_status, target_book_id, target_book_name;
end;
$$;
