create table if not exists public.ledger_book_membership_audit_logs (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.ledger_books(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('joined', 'left', 'removed', 'restored')),
  actor_display_name text not null,
  target_display_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ledger_book_membership_audit_logs_book_created_at_idx
  on public.ledger_book_membership_audit_logs (book_id, created_at desc);

alter table public.ledger_book_membership_audit_logs enable row level security;

revoke all on table public.ledger_book_membership_audit_logs
  from public, anon, authenticated;

create or replace function private.record_ledger_book_membership_audit_log(
  target_book_id uuid,
  target_user_id uuid,
  membership_action text,
  actor_user_id uuid default auth.uid()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_action text := lower(trim(membership_action));
  actor_name text;
  target_name text;
begin
  if normalized_action not in ('joined', 'left', 'removed', 'restored') then
    raise exception 'Unsupported membership audit action %', normalized_action;
  end if;

  select coalesce(nullif(trim(profiles.display_name), ''), '사용자')
  into actor_name
  from public.profiles as profiles
  where profiles.id = actor_user_id;

  select coalesce(nullif(trim(profiles.display_name), ''), '사용자')
  into target_name
  from public.profiles as profiles
  where profiles.id = target_user_id;

  insert into public.ledger_book_membership_audit_logs (
    book_id,
    actor_user_id,
    target_user_id,
    action,
    actor_display_name,
    target_display_name
  )
  values (
    target_book_id,
    actor_user_id,
    target_user_id,
    normalized_action,
    coalesce(actor_name, '사용자'),
    coalesce(target_name, '사용자')
  );
end;
$$;

create or replace function private.record_joined_ledger_book_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_action text := nullif(
    current_setting('app.membership_audit_action', true),
    ''
  );
  requested_actor_id text := nullif(
    current_setting('app.membership_audit_actor_id', true),
    ''
  );
  resolved_action text := case
    when requested_action = 'restored' then 'restored'
    else 'joined'
  end;
  resolved_actor_id uuid := coalesce(requested_actor_id::uuid, auth.uid());
begin
  if new.role <> 'owner' then
    perform private.record_ledger_book_membership_audit_log(
      new.book_id,
      new.user_id,
      resolved_action,
      resolved_actor_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists record_joined_ledger_book_member
on public.ledger_book_members;

create trigger record_joined_ledger_book_member
after insert on public.ledger_book_members
for each row execute function private.record_joined_ledger_book_member();

create or replace function private.leave_active_ledger_book()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_book_id uuid;
  current_book_owner_id uuid;
  fallback_book_id uuid;
  deleted_member_count integer;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  select profiles.active_book_id
  into current_book_id
  from public.profiles as profiles
  where profiles.id = current_user_id;

  if current_book_id is null then
    raise exception 'No active ledger book found for user %', current_user_id;
  end if;

  select books.owner_id
  into current_book_owner_id
  from public.ledger_books as books
  where books.id = current_book_id
  for update;

  if current_book_owner_id is null then
    raise exception 'Active ledger book % was not found', current_book_id;
  end if;

  if current_book_owner_id = current_user_id then
    raise exception 'The active ledger book owner cannot leave their own book';
  end if;

  delete from public.ledger_book_members
  where book_id = current_book_id
    and user_id = current_user_id
    and role <> 'owner';

  get diagnostics deleted_member_count = row_count;
  if deleted_member_count <> 1 then
    raise exception 'Active ledger book membership was not found';
  end if;

  perform private.record_ledger_book_membership_audit_log(
    current_book_id,
    current_user_id,
    'left',
    current_user_id
  );

  fallback_book_id := public.ensure_personal_ledger_book(
    current_user_id,
    '기본 가계부'
  );

  update public.profiles
  set active_book_id = fallback_book_id
  where id = current_user_id;

  return fallback_book_id;
end;
$$;

create or replace function private.remove_member_from_active_ledger_book(
  target_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_book_id uuid;
  current_book_owner_id uuid;
  fallback_book_id uuid;
  deleted_member_count integer;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if target_user_id is null then
    raise exception 'Target user is required';
  end if;

  if target_user_id = current_user_id then
    raise exception 'Owner cannot remove themselves with remove_member_from_active_ledger_book';
  end if;

  select profiles.active_book_id
  into current_book_id
  from public.profiles as profiles
  where profiles.id = current_user_id;

  if current_book_id is null then
    raise exception 'No active ledger book found for owner %', current_user_id;
  end if;

  select books.owner_id
  into current_book_owner_id
  from public.ledger_books as books
  where books.id = current_book_id
  for update;

  if current_book_owner_id <> current_user_id then
    raise exception 'Only the active book owner can remove members';
  end if;

  delete from public.ledger_book_members
  where book_id = current_book_id
    and user_id = target_user_id
    and role <> 'owner';

  get diagnostics deleted_member_count = row_count;
  if deleted_member_count <> 1 then
    raise exception 'Target ledger book membership was not found';
  end if;

  perform private.record_ledger_book_membership_audit_log(
    current_book_id,
    target_user_id,
    'removed',
    current_user_id
  );

  fallback_book_id := public.ensure_personal_ledger_book(
    target_user_id,
    '기본 가계부'
  );

  update public.profiles
  set active_book_id = fallback_book_id
  where id = target_user_id
    and active_book_id = current_book_id;

  return current_book_id;
end;
$$;

create or replace function private.get_ledger_book_membership_audit_logs(
  target_book_id uuid
)
returns table (
  id uuid,
  action text,
  actor_user_id uuid,
  actor_display_name text,
  target_user_id uuid,
  target_display_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  if not exists (
    select 1
    from public.ledger_books as books
    where books.id = target_book_id
      and books.owner_id = auth.uid()
  ) then
    raise exception 'Only the ledger book owner can read membership audit logs';
  end if;

  return query
  select
    logs.id,
    logs.action,
    logs.actor_user_id,
    logs.actor_display_name,
    logs.target_user_id,
    logs.target_display_name,
    logs.created_at
  from public.ledger_book_membership_audit_logs as logs
  where logs.book_id = target_book_id
  order by logs.created_at desc, logs.id desc;
end;
$$;

create or replace function public.get_ledger_book_membership_audit_logs(
  target_book_id uuid
)
returns table (
  id uuid,
  action text,
  actor_user_id uuid,
  actor_display_name text,
  target_user_id uuid,
  target_display_name text,
  created_at timestamptz
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_ledger_book_membership_audit_logs(target_book_id);
$$;

revoke all on function private.record_ledger_book_membership_audit_log(
  uuid,
  uuid,
  text,
  uuid
) from public, anon, authenticated;
revoke all on function private.record_joined_ledger_book_member()
  from public, anon, authenticated;
revoke all on function private.get_ledger_book_membership_audit_logs(uuid)
  from public, anon;
revoke all on function public.get_ledger_book_membership_audit_logs(uuid)
  from public, anon;

grant execute on function private.get_ledger_book_membership_audit_logs(uuid)
  to authenticated;
grant execute on function public.get_ledger_book_membership_audit_logs(uuid)
  to authenticated;
