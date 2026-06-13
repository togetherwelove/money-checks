create table if not exists public.ledger_book_join_requests (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.ledger_books(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (book_id, requester_user_id)
);

alter table public.ledger_book_join_requests enable row level security;
alter table public.ledger_book_join_requests replica identity full;

create or replace function public.is_book_owner(target_book_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.ledger_books as books
    where books.id = target_book_id
      and books.owner_id = auth.uid()
  );
$$;

create or replace function public.request_ledger_book_join_by_code(input_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  target_book_id uuid;
  target_owner_id uuid;
begin
  normalized_code := upper(trim(input_code));

  select books.id, books.owner_id
  into target_book_id, target_owner_id
  from public.ledger_books as books
  where books.share_code = normalized_code;

  if target_book_id is null then
    raise exception 'Ledger book not found for code %', normalized_code;
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
    timezone('utc', now()),
    null,
    null
  )
  on conflict (book_id, requester_user_id) do update
    set status = 'pending',
        created_at = timezone('utc', now()),
        reviewed_at = null,
        reviewed_by = null;

  return 'requested';
end;
$$;

create or replace function public.get_pending_ledger_book_join_requests(target_book_id uuid)
returns table (
  id uuid,
  requester_user_id uuid,
  display_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_book_owner(target_book_id) then
    raise exception 'Only the book owner can read pending join requests';
  end if;

  return query
  select
    requests.id,
    requests.requester_user_id,
    profiles.display_name,
    requests.created_at
  from public.ledger_book_join_requests as requests
  left join public.profiles as profiles
    on profiles.id = requests.requester_user_id
  where requests.book_id = target_book_id
    and requests.status = 'pending'
  order by requests.created_at asc, requests.requester_user_id;
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

create or replace function public.reject_ledger_book_join_request(target_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_book_id uuid;
begin
  select requests.book_id
  into request_book_id
  from public.ledger_book_join_requests as requests
  where requests.id = target_request_id
    and requests.status = 'pending';

  if request_book_id is null then
    raise exception 'Pending join request % was not found', target_request_id;
  end if;

  if not public.is_book_owner(request_book_id) then
    raise exception 'Only the book owner can reject join requests';
  end if;

  update public.ledger_book_join_requests
  set status = 'rejected',
      reviewed_at = timezone('utc', now()),
      reviewed_by = auth.uid()
  where id = target_request_id;

  return request_book_id;
end;
$$;

drop policy if exists "ledger_book_join_requests_select_related" on public.ledger_book_join_requests;

create policy "ledger_book_join_requests_select_related" on public.ledger_book_join_requests
for select using (
  requester_user_id = auth.uid()
  or public.is_book_owner(book_id)
);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ledger_book_join_requests'
  ) then
    execute 'alter publication supabase_realtime add table public.ledger_book_join_requests';
  end if;
end;
$$;

revoke all on function public.is_book_owner(uuid) from public;
revoke all on function public.request_ledger_book_join_by_code(text) from public;
revoke all on function public.get_pending_ledger_book_join_requests(uuid) from public;
revoke all on function public.approve_ledger_book_join_request(uuid) from public;
revoke all on function public.reject_ledger_book_join_request(uuid) from public;

grant execute on function public.is_book_owner(uuid) to authenticated;
grant execute on function public.request_ledger_book_join_by_code(text) to authenticated;
grant execute on function public.get_pending_ledger_book_join_requests(uuid) to authenticated;
grant execute on function public.approve_ledger_book_join_request(uuid) to authenticated;
grant execute on function public.reject_ledger_book_join_request(uuid) to authenticated;
