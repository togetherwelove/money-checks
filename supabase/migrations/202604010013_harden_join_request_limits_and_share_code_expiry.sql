create or replace function public.share_code_time_to_live()
returns interval
language sql
stable
as $$
  select interval '30 days';
$$;

create or replace function public.join_request_pending_cooldown()
returns interval
language sql
stable
as $$
  select interval '10 minutes';
$$;

create or replace function public.join_request_retry_cooldown()
returns interval
language sql
stable
as $$
  select interval '1 hour';
$$;

alter table public.ledger_books
  add column if not exists share_code_created_at timestamptz,
  add column if not exists share_code_expires_at timestamptz;

update public.ledger_books
set share_code_created_at = coalesce(share_code_created_at, created_at, timezone('utc', now()));

update public.ledger_books
set share_code_expires_at = coalesce(
  share_code_expires_at,
  share_code_created_at + public.share_code_time_to_live()
);

alter table public.ledger_books
  alter column share_code_created_at set not null,
  alter column share_code_expires_at set not null;

alter table public.ledger_books
  drop constraint if exists ledger_books_share_code_expiry_order;

alter table public.ledger_books
  add constraint ledger_books_share_code_expiry_order
  check (share_code_expires_at > share_code_created_at);

create or replace function public.get_accessible_ledger_book(target_book_id uuid)
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
  rotation_now timestamptz := timezone('utc', now());
begin
  if not public.is_book_member(target_book_id) then
    raise exception 'Ledger book % is not accessible for the current user', target_book_id;
  end if;

  if public.is_book_owner(target_book_id) then
    update public.ledger_books as books
    set share_code = public.generate_share_code(),
        share_code_created_at = rotation_now,
        share_code_expires_at = rotation_now + public.share_code_time_to_live()
    where books.id = target_book_id
      and books.share_code_expires_at <= rotation_now;
  end if;

  return query
  select books.id, books.name, books.owner_id, books.share_code
  from public.ledger_books as books
  where books.id = target_book_id;
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

revoke all on function public.share_code_time_to_live() from public;
revoke all on function public.join_request_pending_cooldown() from public;
revoke all on function public.join_request_retry_cooldown() from public;
revoke all on function public.get_accessible_ledger_book(uuid) from public;

grant execute on function public.get_accessible_ledger_book(uuid) to authenticated;
