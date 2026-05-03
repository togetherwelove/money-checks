create schema if not exists private;

revoke usage on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.receipt_file_storage_object_limit()
returns integer
language sql
immutable
set search_path = public
as $$
  select 300;
$$;

create or replace function private.can_upload_receipt_file_storage_object(
  target_bucket_id text,
  target_object_name text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  current_user_id uuid := auth.uid();
  current_object_count integer := 0;
begin
  if current_user_id is null then
    return false;
  end if;

  if target_bucket_id <> 'receipt-files' then
    return false;
  end if;

  if current_user_id::text <> (storage.foldername(target_object_name))[1] then
    return false;
  end if;

  select count(*)
  into current_object_count
  from storage.objects as objects
  where objects.bucket_id = target_bucket_id
    and (storage.foldername(objects.name))[1] = current_user_id::text;

  return current_object_count < private.receipt_file_storage_object_limit();
end;
$$;

revoke execute on function private.receipt_file_storage_object_limit() from public, anon, authenticated;
revoke execute on function private.can_upload_receipt_file_storage_object(text, text) from public, anon;
grant execute on function private.can_upload_receipt_file_storage_object(text, text) to authenticated;

drop policy if exists "receipt_files_bucket_insert_own" on storage.objects;
create policy "receipt_files_bucket_insert_own" on storage.objects
for insert to authenticated
with check (
  private.can_upload_receipt_file_storage_object(bucket_id, name)
);

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
