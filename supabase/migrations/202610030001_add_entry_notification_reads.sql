create table public.entry_notification_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.ledger_entries(id) on delete cascade,
  primary key (user_id, entry_id)
);

alter table public.entry_notification_reads enable row level security;

create policy "entry_notification_reads_select_own"
on public.entry_notification_reads for select
using ((select auth.uid()) = user_id);

create policy "entry_notification_reads_insert_own"
on public.entry_notification_reads for insert
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.ledger_entries as entries
    where entries.id = entry_id and public.is_book_member(entries.book_id)
  )
);

create function public.mark_entry_notifications_read(
  target_book_id uuid,
  target_entry_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_book_member(target_book_id) then
    raise exception 'Ledger book access is required.';
  end if;

  insert into public.entry_notification_reads (user_id, entry_id)
  select auth.uid(), entries.id
  from public.ledger_entries as entries
  where entries.book_id = target_book_id
    and entries.id = any(target_entry_ids)
    and entries.user_id is distinct from auth.uid()
  on conflict (user_id, entry_id) do nothing;
end;
$$;

revoke all on table public.entry_notification_reads from public, anon;
grant select, insert on table public.entry_notification_reads to authenticated;
revoke all on function public.mark_entry_notifications_read(uuid, uuid[]) from public, anon;
grant execute on function public.mark_entry_notifications_read(uuid, uuid[]) to authenticated;

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
        and not exists (
          select 1 from public.entry_notification_reads as entry_reads
          where entry_reads.user_id = members.user_id
            and entry_reads.entry_id = entries.id
        )
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

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.entry_notification_reads;
  end if;
end;
$$;
