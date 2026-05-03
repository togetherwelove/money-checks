create or replace function private.merge_owned_ledger_books_into_target(
  source_owner_id uuid,
  target_book_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  merged_note_separator text := E'\n\n';
begin
  if source_owner_id is null or target_book_id is null then
    raise exception 'Source owner and target book are required';
  end if;

  update public.ledger_entries as entries
  set book_id = target_book_id
  where entries.user_id = source_owner_id
    and exists (
      select 1
      from public.ledger_books as books
      where books.id = entries.book_id
        and books.owner_id = source_owner_id
        and books.id <> target_book_id
    );

  insert into public.ledger_day_notes (
    book_id,
    user_id,
    occurred_on,
    note,
    created_at,
    updated_at
  )
  select
    target_book_id,
    source_owner_id,
    notes.occurred_on,
    string_agg(notes.note, merged_note_separator order by notes.created_at, notes.id),
    min(notes.created_at),
    max(notes.updated_at)
  from public.ledger_day_notes as notes
  where notes.user_id = source_owner_id
    and exists (
      select 1
      from public.ledger_books as books
      where books.id = notes.book_id
        and books.owner_id = source_owner_id
        and books.id <> target_book_id
    )
  group by notes.occurred_on
  on conflict (book_id, occurred_on) do update
    set note = case
          when trim(public.ledger_day_notes.note) = '' then excluded.note
          when trim(excluded.note) = '' then public.ledger_day_notes.note
          else public.ledger_day_notes.note || merged_note_separator || excluded.note
        end,
        updated_at = greatest(public.ledger_day_notes.updated_at, excluded.updated_at);

  delete from public.ledger_books as books
  where books.owner_id = source_owner_id
    and books.id <> target_book_id;
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
  requester_accessible_book_count integer := 0;
  requester_accessible_book_limit integer;
  requester_subscription_tier text := 'free';
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

    select coalesce(profiles.subscription_tier, 'free')
    into requester_subscription_tier
    from public.profiles as profiles
    where profiles.id = request_user_id
    for update;

    requester_accessible_book_limit := public.accessible_ledger_book_limit(
      requester_subscription_tier
    );

    select count(*)
    into requester_accessible_book_count
    from public.ledger_book_members as members
    where members.user_id = request_user_id;

    if requester_accessible_book_count >= requester_accessible_book_limit then
      if requester_subscription_tier = 'free' and requester_accessible_book_limit = 1 then
        perform private.merge_owned_ledger_books_into_target(request_user_id, request_book_id);

        select count(*)
        into requester_accessible_book_count
        from public.ledger_book_members as members
        where members.user_id = request_user_id;

        if requester_accessible_book_count >= requester_accessible_book_limit then
          raise exception using
            message = 'Accessible ledger book limit reached for subscription tier.',
            detail = 'Free users can access one ledger book and plus users can access three ledger books.';
        end if;
      else
        raise exception using
          message = 'Accessible ledger book limit reached for subscription tier.',
          detail = 'Free users can access one ledger book and plus users can access three ledger books.';
      end if;
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

revoke all on function private.merge_owned_ledger_books_into_target(uuid, uuid) from public, anon, authenticated;
