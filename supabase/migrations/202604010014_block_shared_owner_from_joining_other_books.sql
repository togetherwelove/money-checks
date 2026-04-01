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

  select profiles.active_book_id
  into current_active_book_id
  from public.profiles as profiles
  where profiles.id = auth.uid();

  if current_active_book_id is not null
    and current_active_book_id <> target_book_id
    and exists (
      select 1
      from public.ledger_books as books
      where books.id = current_active_book_id
        and books.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.ledger_book_members as members
      where members.book_id = current_active_book_id
        and members.user_id <> auth.uid()
    ) then
    raise exception using
      message = 'Shared ledger owners cannot request another shared ledger.',
      detail = 'Leave or transfer your current shared ledger before requesting a different one.';
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
