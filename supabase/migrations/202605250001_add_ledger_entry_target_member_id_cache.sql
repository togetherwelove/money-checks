alter table public.ledger_entries
add column if not exists target_member_id uuid;

create or replace function private.set_ledger_entry_target_member_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.target_member_id = case
    when (new.metadata ->> 'target_member_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (new.metadata ->> 'target_member_id')::uuid
    else new.user_id
  end;

  return new;
end;
$$;

update public.ledger_entries
set target_member_id = case
  when (metadata ->> 'target_member_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (metadata ->> 'target_member_id')::uuid
  else user_id
end
where target_member_id is null;

drop trigger if exists set_ledger_entry_target_member_id on public.ledger_entries;

create trigger set_ledger_entry_target_member_id
before insert or update of metadata, user_id on public.ledger_entries
for each row
execute function private.set_ledger_entry_target_member_id();

create index if not exists ledger_entries_book_target_member_id_idx
on public.ledger_entries (book_id, target_member_id);

create or replace function private.get_ledger_entry_summaries_with_names(
  target_book_id uuid,
  date_from date default null,
  date_to date default null
)
returns table (
  book_id uuid,
  id uuid,
  user_id uuid,
  source_type text,
  entry_type text,
  occurred_on date,
  amount numeric,
  currency text,
  content text,
  category text,
  category_id text,
  installment_group_id text,
  installment_months integer,
  installment_order integer,
  note text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  author_display_name text,
  target_member_display_name text
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  if not private.is_book_member(target_book_id) then
    raise exception using
      errcode = '42501',
      message = 'Ledger book is not accessible to the current user.';
  end if;

  return query
  select
    entries.book_id,
    entries.id,
    entries.user_id,
    entries.source_type,
    entries.entry_type,
    entries.occurred_on,
    entries.amount,
    entries.currency,
    entries.content,
    entries.category,
    entries.category_id,
    entries.installment_group_id,
    entries.installment_months,
    entries.installment_order,
    entries.note,
    entries.metadata,
    entries.created_at,
    entries.updated_at,
    author_profiles.display_name as author_display_name,
    target_profiles.display_name as target_member_display_name
  from public.ledger_entries as entries
  left join public.profiles as author_profiles
    on author_profiles.id = entries.user_id
  left join public.profiles as target_profiles
    on target_profiles.id = coalesce(entries.target_member_id, entries.user_id)
  where entries.book_id = target_book_id
    and (date_from is null or entries.occurred_on >= date_from)
    and (date_to is null or entries.occurred_on <= date_to)
  order by entries.occurred_on asc, entries.id asc;
end;
$$;
