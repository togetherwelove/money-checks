create table if not exists public.notification_badge_read_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.ledger_books(id) on delete cascade,
  scope text not null check (scope in ('ledger-entries', 'join-requests')),
  last_read_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, book_id, scope)
);

alter table public.notification_badge_read_states enable row level security;

drop policy if exists "notification_badge_read_states_select_own"
on public.notification_badge_read_states;
drop policy if exists "notification_badge_read_states_insert_own"
on public.notification_badge_read_states;
drop policy if exists "notification_badge_read_states_update_own"
on public.notification_badge_read_states;

create policy "notification_badge_read_states_select_own"
on public.notification_badge_read_states
for select
using ((select auth.uid()) = user_id);

create policy "notification_badge_read_states_insert_own"
on public.notification_badge_read_states
for insert
with check (
  (select auth.uid()) = user_id
  and public.is_book_member(book_id)
);

create policy "notification_badge_read_states_update_own"
on public.notification_badge_read_states
for update
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and public.is_book_member(book_id)
);

with migration_baseline as (
  select clock_timestamp() as read_at
)
insert into public.notification_badge_read_states (
  user_id,
  book_id,
  scope,
  last_read_at
)
select
  members.user_id,
  members.book_id,
  'ledger-entries',
  migration_baseline.read_at
from public.ledger_book_members as members
cross join migration_baseline
on conflict (user_id, book_id, scope) do nothing;

with migration_baseline as (
  select clock_timestamp() as read_at
)
insert into public.notification_badge_read_states (
  user_id,
  book_id,
  scope,
  last_read_at
)
select
  members.user_id,
  members.book_id,
  'join-requests',
  migration_baseline.read_at
from public.ledger_book_members as members
cross join migration_baseline
where members.role = 'owner'
on conflict (user_id, book_id, scope) do nothing;

create or replace function private.sync_notification_badge_read_states_for_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification_badge_read_states (
    user_id,
    book_id,
    scope,
    last_read_at
  )
  values (
    new.user_id,
    new.book_id,
    'ledger-entries',
    clock_timestamp()
  )
  on conflict (user_id, book_id, scope) do nothing;

  if new.role = 'owner' then
    insert into public.notification_badge_read_states (
      user_id,
      book_id,
      scope,
      last_read_at
    )
    values (
      new.user_id,
      new.book_id,
      'join-requests',
      clock_timestamp()
    )
    on conflict (user_id, book_id, scope) do nothing;
  else
    delete from public.notification_badge_read_states
    where user_id = new.user_id
      and book_id = new.book_id
      and scope = 'join-requests';
  end if;

  return new;
end;
$$;

create or replace function private.delete_notification_badge_read_states_for_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.notification_badge_read_states
  where user_id = old.user_id
    and book_id = old.book_id;

  return old;
end;
$$;

drop trigger if exists sync_notification_badge_read_states_for_membership
on public.ledger_book_members;
create trigger sync_notification_badge_read_states_for_membership
after insert or update of role on public.ledger_book_members
for each row execute function private.sync_notification_badge_read_states_for_membership();

drop trigger if exists delete_notification_badge_read_states_for_membership
on public.ledger_book_members;
create trigger delete_notification_badge_read_states_for_membership
after delete on public.ledger_book_members
for each row execute function private.delete_notification_badge_read_states_for_membership();

create index if not exists ledger_book_join_requests_pending_book_created_at_idx
on public.ledger_book_join_requests (book_id, created_at desc)
where status = 'pending';

create or replace function public.get_notification_badge_state()
returns table (
  book_id uuid,
  ledger_entry_unread_count bigint,
  join_request_unread_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    members.book_id,
    (
      select count(*)
      from public.ledger_entries as entries
      join public.notification_badge_read_states as read_states
        on read_states.user_id = members.user_id
        and read_states.book_id = members.book_id
        and read_states.scope = 'ledger-entries'
      where entries.book_id = members.book_id
        and entries.user_id is distinct from members.user_id
        and entries.created_at > read_states.last_read_at
    ) as ledger_entry_unread_count,
    case
      when members.role = 'owner' then (
        select count(*)
        from public.ledger_book_join_requests as requests
        join public.notification_badge_read_states as read_states
          on read_states.user_id = members.user_id
          and read_states.book_id = members.book_id
          and read_states.scope = 'join-requests'
        where requests.book_id = members.book_id
          and requests.status = 'pending'
          and requests.created_at > read_states.last_read_at
      )
      else 0::bigint
    end as join_request_unread_count
  from public.ledger_book_members as members
  where members.user_id = (select auth.uid())
  order by members.created_at, members.book_id;
$$;

create or replace function public.mark_notification_badges_read(
  target_book_id uuid,
  target_scope text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  membership_role text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if target_scope not in ('ledger-entries', 'join-requests') then
    raise exception 'Unsupported notification badge scope.';
  end if;

  select members.role
  into membership_role
  from public.ledger_book_members as members
  where members.user_id = current_user_id
    and members.book_id = target_book_id;

  if membership_role is null then
    raise exception 'Ledger book access is required.';
  end if;

  if target_scope = 'join-requests' and membership_role <> 'owner' then
    raise exception 'Only the ledger book owner can read join request badges.';
  end if;

  insert into public.notification_badge_read_states (
    user_id,
    book_id,
    scope,
    last_read_at
  )
  values (
    current_user_id,
    target_book_id,
    target_scope,
    clock_timestamp()
  )
  on conflict (user_id, book_id, scope) do update
  set last_read_at = excluded.last_read_at;
end;
$$;

revoke all on table public.notification_badge_read_states from public, anon;
grant select, insert, update on table public.notification_badge_read_states to authenticated;

revoke all on function private.sync_notification_badge_read_states_for_membership()
from public, anon, authenticated;
revoke all on function private.delete_notification_badge_read_states_for_membership()
from public, anon, authenticated;
revoke all on function public.get_notification_badge_state()
from public, anon, authenticated;
revoke all on function public.mark_notification_badges_read(uuid, text)
from public, anon, authenticated;

grant execute on function public.get_notification_badge_state() to authenticated;
grant execute on function public.mark_notification_badges_read(uuid, text) to authenticated;

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
      and tablename = 'notification_badge_read_states'
  ) then
    execute
      'alter publication supabase_realtime add table public.notification_badge_read_states';
  end if;
end;
$$;
