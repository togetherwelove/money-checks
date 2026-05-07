alter table public.ledger_book_join_requests
add column if not exists join_resolution text not null default 'standard';

alter table public.ledger_book_join_requests
drop constraint if exists ledger_book_join_requests_join_resolution_check;

alter table public.ledger_book_join_requests
add constraint ledger_book_join_requests_join_resolution_check
check (join_resolution in ('standard', 'merge_personal_book_on_approval'));

create or replace function private.can_merge_owned_personal_ledger_books_into_target(
  source_owner_id uuid,
  target_book_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  owned_book_count integer := 0;
  owned_shared_book_count integer := 0;
begin
  if source_owner_id is null or target_book_id is null then
    return false;
  end if;

  select count(*)
  into owned_book_count
  from public.ledger_books as books
  where books.owner_id = source_owner_id
    and books.id <> target_book_id;

  if owned_book_count = 0 then
    return false;
  end if;

  select count(distinct books.id)
  into owned_shared_book_count
  from public.ledger_books as books
  join public.ledger_book_members as members
    on members.book_id = books.id
  where books.owner_id = source_owner_id
    and books.id <> target_book_id
    and members.user_id <> source_owner_id;

  return owned_shared_book_count = 0;
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

      return 'needs_personal_book_merge_confirmation';
    end if;
  end if;

  return 'blocked_accessible_limit';
end;
$$;

create or replace function private.raise_ledger_book_join_not_allowed(approval_status text)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if approval_status = 'blocked_target_member_limit' then
    raise exception using
      message = 'Shared ledger member limit reached for owner subscription tier.',
      detail = 'Free plan ledger books can have two total members and plus plan ledger books can have five total members.';
  end if;

  if approval_status = 'blocked_shared_owner_free' then
    raise exception using
      message = 'Free shared ledger owners cannot join another ledger.',
      detail = 'Remove members from the current ledger or upgrade to plus before joining another ledger.';
  end if;

  if approval_status = 'blocked_shared_editor_free' then
    raise exception using
      message = 'Free shared ledger editors cannot join another ledger.',
      detail = 'Leave the current shared ledger or upgrade to plus before joining another ledger.';
  end if;

  if approval_status = 'needs_personal_book_merge_confirmation' then
    raise exception using
      message = 'Join request requires personal ledger merge confirmation.',
      detail = 'Confirm that the current personal ledger will be merged into the shared ledger before requesting access.';
  end if;

  raise exception using
    message = 'Accessible ledger book limit reached for subscription tier.',
    detail = 'Free users can access one ledger book and plus users can access three ledger books.';
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
    and existing_request_created_at > preview_now - public.join_request_pending_cooldown() then
    return query select 'pending_request'::text, target_book_id, target_book_name;
    return;
  end if;

  if existing_request_status = 'approved'
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

  if approval_status = 'needs_personal_book_merge_confirmation' then
    return query select 'can_request_with_personal_book_merge'::text, target_book_id, target_book_name;
    return;
  end if;

  return query select approval_status, target_book_id, target_book_name;
end;
$$;

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

  if not private.can_merge_owned_personal_ledger_books_into_target(
    source_owner_id,
    target_book_id
  ) then
    raise exception using
      message = 'Only personal ledgers can be merged automatically.',
      detail = 'Shared ledgers with other members must be handled manually.';
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

drop function if exists public.request_ledger_book_join_by_code(text);
drop function if exists private.request_ledger_book_join_by_code(text);
drop function if exists public.get_pending_ledger_book_join_requests(uuid);
drop function if exists private.get_pending_ledger_book_join_requests(uuid);

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

  if join_resolution not in ('standard', 'merge_personal_book_on_approval') then
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

  if approval_status not in ('can_approve', 'can_approve_with_personal_book_merge') then
    perform private.raise_ledger_book_join_not_allowed(approval_status);
  end if;

  if approval_status = 'can_approve_with_personal_book_merge' then
    effective_join_resolution := 'merge_personal_book_on_approval';
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

create or replace function private.get_pending_ledger_book_join_requests(target_book_id uuid)
returns table (
  id uuid,
  requester_user_id uuid,
  display_name text,
  created_at timestamptz,
  join_resolution text,
  approval_status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_book_owner(target_book_id) then
    raise exception 'Only the book owner can read pending join requests';
  end if;

  return query
  select
    requests.id,
    requests.requester_user_id,
    profiles.display_name,
    requests.created_at,
    requests.join_resolution,
    private.resolve_ledger_book_join_approval_status(
      requests.requester_user_id,
      requests.book_id,
      requests.join_resolution
    ) as approval_status
  from public.ledger_book_join_requests as requests
  left join public.profiles as profiles
    on profiles.id = requests.requester_user_id
  where requests.book_id = target_book_id
    and requests.status = 'pending'
  order by requests.created_at asc, requests.requester_user_id;
end;
$$;

create or replace function public.preview_ledger_book_join_by_code(input_code text)
returns table (
  status text,
  target_book_id uuid,
  target_book_name text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.preview_ledger_book_join_by_code(input_code);
$$;

create or replace function public.request_ledger_book_join_by_code(
  input_code text,
  join_resolution text default 'standard'
)
returns text
language sql
security invoker
set search_path = public, private
as $$
  select private.request_ledger_book_join_by_code(input_code, join_resolution);
$$;

create or replace function public.get_pending_ledger_book_join_requests(target_book_id uuid)
returns table (
  id uuid,
  requester_user_id uuid,
  display_name text,
  created_at timestamptz,
  join_resolution text,
  approval_status text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_pending_ledger_book_join_requests(target_book_id);
$$;

revoke execute on function private.can_merge_owned_personal_ledger_books_into_target(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function private.resolve_ledger_book_join_approval_status(uuid, uuid, text)
  from public, anon, authenticated;
revoke execute on function private.raise_ledger_book_join_not_allowed(text)
  from public, anon, authenticated;
revoke execute on function private.preview_ledger_book_join_by_code(text)
  from public, anon;
revoke execute on function private.request_ledger_book_join_by_code(text, text)
  from public, anon;
revoke execute on function private.get_pending_ledger_book_join_requests(uuid)
  from public, anon;

grant execute on function private.preview_ledger_book_join_by_code(text) to authenticated;
grant execute on function private.request_ledger_book_join_by_code(text, text) to authenticated;
grant execute on function private.get_pending_ledger_book_join_requests(uuid) to authenticated;

revoke execute on function public.preview_ledger_book_join_by_code(text) from public, anon;
revoke execute on function public.request_ledger_book_join_by_code(text, text) from public, anon;
revoke execute on function public.get_pending_ledger_book_join_requests(uuid) from public, anon;
grant execute on function public.preview_ledger_book_join_by_code(text) to authenticated;
grant execute on function public.request_ledger_book_join_by_code(text, text) to authenticated;
grant execute on function public.get_pending_ledger_book_join_requests(uuid) to authenticated;
