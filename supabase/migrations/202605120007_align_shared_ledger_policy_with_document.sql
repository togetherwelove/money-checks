create or replace function public.share_code_time_to_live()
returns interval
language sql
stable
set search_path = public
as $$
  select interval '7 days';
$$;

create or replace function public.join_request_time_to_live()
returns interval
language sql
stable
set search_path = public
as $$
  select interval '7 days';
$$;

create or replace function public.join_request_pending_cooldown()
returns interval
language sql
stable
set search_path = public
as $$
  select interval '20 seconds';
$$;

create or replace function public.join_request_retry_cooldown()
returns interval
language sql
stable
set search_path = public
as $$
  select interval '20 seconds';
$$;

update public.ledger_book_members
set role = 'editor'
where role = 'viewer';

alter table public.ledger_book_members
drop constraint if exists ledger_book_members_role_check;

alter table public.ledger_book_members
add constraint ledger_book_members_role_check
check (role in ('owner', 'editor'));

create or replace function private.is_ledger_book_editable_by_current_user(target_book_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  accessible_book_count integer := 0;
  accessible_book_limit integer;
  current_user_id uuid := auth.uid();
  current_user_subscription_tier text := 'free';
  current_member_count integer := 0;
  owner_subscription_tier text := 'free';
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

  select count(*)
  into accessible_book_count
  from public.ledger_book_members as members
  where members.user_id = current_user_id;

  if accessible_book_count > accessible_book_limit then
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

create or replace function private.is_book_editor(target_book_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select private.is_ledger_book_editable_by_current_user(target_book_id);
$$;

create or replace function private.delete_receipt_files_for_owned_personal_ledgers(
  source_owner_id uuid,
  target_book_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects as objects
  using (
    select distinct receipt_files.storage_bucket, receipt_files.storage_path
    from public.ledger_books as books
    join public.ledger_entries as entries
      on entries.book_id = books.id
    join public.ledger_entry_attachments as attachments
      on attachments.ledger_entry_id = entries.id
      or (
        attachments.installment_group_id is not null
        and attachments.installment_group_id = entries.installment_group_id
      )
    join public.receipt_files as receipt_files
      on receipt_files.id = attachments.receipt_file_id
    where books.owner_id = source_owner_id
      and books.id <> target_book_id
  ) as target_files
  where objects.bucket_id = target_files.storage_bucket
    and objects.name = target_files.storage_path;

  delete from public.receipt_files as receipt_files
  using (
    select distinct receipt_files.id
    from public.ledger_books as books
    join public.ledger_entries as entries
      on entries.book_id = books.id
    join public.ledger_entry_attachments as attachments
      on attachments.ledger_entry_id = entries.id
      or (
        attachments.installment_group_id is not null
        and attachments.installment_group_id = entries.installment_group_id
      )
    join public.receipt_files as receipt_files
      on receipt_files.id = attachments.receipt_file_id
    where books.owner_id = source_owner_id
      and books.id <> target_book_id
  ) as target_files
  where receipt_files.id = target_files.id;
end;
$$;

create or replace function private.delete_receipt_files_for_ledger_book(target_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects as objects
  using (
    select distinct receipt_files.storage_bucket, receipt_files.storage_path
    from public.ledger_entries as entries
    join public.ledger_entry_attachments as attachments
      on attachments.ledger_entry_id = entries.id
      or (
        attachments.installment_group_id is not null
        and attachments.installment_group_id = entries.installment_group_id
      )
    join public.receipt_files as receipt_files
      on receipt_files.id = attachments.receipt_file_id
    where entries.book_id = target_book_id
  ) as target_files
  where objects.bucket_id = target_files.storage_bucket
    and objects.name = target_files.storage_path;

  delete from public.receipt_files as receipt_files
  using (
    select distinct receipt_files.id
    from public.ledger_entries as entries
    join public.ledger_entry_attachments as attachments
      on attachments.ledger_entry_id = entries.id
      or (
        attachments.installment_group_id is not null
        and attachments.installment_group_id = entries.installment_group_id
      )
    join public.receipt_files as receipt_files
      on receipt_files.id = attachments.receipt_file_id
    where entries.book_id = target_book_id
  ) as target_files
  where receipt_files.id = target_files.id;
end;
$$;

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

  if not private.can_discard_owned_personal_ledger_books_before_join(
    source_owner_id,
    target_book_id
  ) then
    raise exception using
      message = 'Only personal ledgers can be discarded automatically.',
      detail = 'Shared ledgers with other members must be handled manually.';
  end if;

  perform private.delete_receipt_files_for_owned_personal_ledgers(source_owner_id, target_book_id);

  delete from public.ledger_books as books
  where books.owner_id = source_owner_id
    and books.id <> target_book_id;
end;
$$;

create or replace function private.delete_owned_ledger_book(target_book_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  fallback_book_id uuid;
  target_owner_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  select books.owner_id
  into target_owner_id
  from public.ledger_books as books
  where books.id = target_book_id;

  if target_owner_id is null then
    raise exception 'Ledger book % was not found', target_book_id;
  end if;

  if target_owner_id <> current_user_id then
    raise exception 'Only the owner can delete this ledger book';
  end if;

  if exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = target_book_id
      and members.user_id <> current_user_id
  ) then
    raise exception using
      message = 'Shared ledger books with editors cannot be deleted.',
      detail = 'Remove all editors before deleting this ledger book.';
  end if;

  select members.book_id
  into fallback_book_id
  from public.ledger_book_members as members
  join public.ledger_books as books
    on books.id = members.book_id
  where members.user_id = current_user_id
    and members.book_id <> target_book_id
  order by
    case when books.owner_id = current_user_id then 0 else 1 end,
    books.created_at,
    books.id
  limit 1;

  perform private.delete_receipt_files_for_ledger_book(target_book_id);

  delete from public.ledger_books as books
  where books.id = target_book_id
    and books.owner_id = current_user_id;

  if fallback_book_id is null then
    fallback_book_id := private.ensure_own_personal_ledger_book();
  end if;

  update public.profiles
  set active_book_id = fallback_book_id
  where id = current_user_id
    and (active_book_id = target_book_id or active_book_id is null);

  return fallback_book_id;
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

  if approval_status = 'can_approve_with_personal_book_discard' then
    return query select 'can_request_with_personal_book_discard'::text, target_book_id, target_book_name;
    return;
  end if;

  return query select approval_status, target_book_id, target_book_name;
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
  normalized_join_resolution text := coalesce(join_resolution, 'standard');
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

  if normalized_join_resolution = 'merge_personal_book_on_approval' then
    normalized_join_resolution := 'discard_personal_book_on_approval';
  end if;

  if normalized_join_resolution not in (
    'standard',
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
    and existing_request_created_at > request_now - public.join_request_time_to_live() then
    raise exception using
      message = 'A join request is already pending.',
      detail = 'Please wait until the owner reviews this request.';
  end if;

  if existing_request_status in ('approved', 'rejected')
    and coalesce(existing_request_reviewed_at, existing_request_created_at) >
      request_now - public.join_request_retry_cooldown() then
    raise exception using
      message = 'This join request is cooling down.',
      detail = 'Please wait before requesting access again.';
  end if;

  approval_status := private.resolve_ledger_book_join_approval_status(
    current_user_id,
    target_book_id,
    normalized_join_resolution
  );

  if approval_status not in (
    'can_approve',
    'can_approve_with_personal_book_discard'
  ) then
    perform private.raise_ledger_book_join_not_allowed(approval_status);
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
  request_created_at timestamptz;
  request_join_resolution text := 'standard';
  requester_is_already_member boolean := false;
  approval_status text;
  approval_now timestamptz := timezone('utc', now());
begin
  select requests.book_id, requests.requester_user_id, requests.created_at, requests.join_resolution
  into request_book_id, request_user_id, request_created_at, request_join_resolution
  from public.ledger_book_join_requests as requests
  where requests.id = target_request_id
    and requests.status = 'pending';

  if request_book_id is null or request_user_id is null then
    raise exception 'Pending join request % was not found', target_request_id;
  end if;

  if request_created_at <= approval_now - public.join_request_time_to_live() then
    raise exception using
      message = 'This join request has expired.',
      detail = 'Ask the requester to send a new join request.';
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

    if approval_status not in (
      'can_approve',
      'can_approve_with_personal_book_discard'
    ) then
      perform private.raise_ledger_book_join_not_allowed(approval_status);
    end if;

    insert into public.ledger_book_members (book_id, user_id, role)
    values (request_book_id, request_user_id, 'editor')
    on conflict (book_id, user_id) do nothing;

    update public.profiles
    set active_book_id = request_book_id
    where id = request_user_id;

    if approval_status = 'can_approve_with_personal_book_discard' then
      perform private.discard_owned_personal_ledger_books_before_join(
        request_user_id,
        request_book_id
      );
    end if;
  else
    update public.profiles
    set active_book_id = request_book_id
    where id = request_user_id;
  end if;

  update public.ledger_book_join_requests
  set status = 'approved',
      reviewed_at = approval_now,
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
declare
  request_now timestamptz := timezone('utc', now());
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
    and requests.created_at > request_now - public.join_request_time_to_live()
  order by requests.created_at asc, requests.requester_user_id;
end;
$$;

create or replace function public.delete_owned_ledger_book(target_book_id uuid)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.delete_owned_ledger_book(target_book_id);
$$;

revoke all on function public.join_request_time_to_live() from public, anon, authenticated;
revoke execute on function private.is_ledger_book_editable_by_current_user(uuid)
  from public, anon, authenticated;
revoke execute on function private.delete_receipt_files_for_owned_personal_ledgers(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function private.delete_receipt_files_for_ledger_book(uuid)
  from public, anon, authenticated;
revoke execute on function private.delete_owned_ledger_book(uuid)
  from public, anon;
revoke execute on function public.delete_owned_ledger_book(uuid)
  from public, anon;

grant execute on function private.is_book_editor(uuid) to authenticated;
grant execute on function private.delete_owned_ledger_book(uuid) to authenticated;
grant execute on function public.delete_owned_ledger_book(uuid) to authenticated;
