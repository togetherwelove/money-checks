create or replace function private.get_ledger_entry_summaries(
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
  installment_group_id uuid,
  installment_months integer,
  installment_order integer,
  note text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
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
    entries.updated_at
  from public.ledger_entries as entries
  where entries.book_id = target_book_id
    and (date_from is null or entries.occurred_on >= date_from)
    and (date_to is null or entries.occurred_on <= date_to)
  order by entries.occurred_on asc, entries.id asc;
end;
$$;

create or replace function public.get_ledger_entry_summaries(
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
  installment_group_id uuid,
  installment_months integer,
  installment_order integer,
  note text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_ledger_entry_summaries(target_book_id, date_from, date_to);
$$;

create or replace function private.get_ledger_day_notes_in_range(
  target_book_id uuid,
  date_from date default null,
  date_to date default null
)
returns table (
  book_id uuid,
  created_at timestamptz,
  id uuid,
  note text,
  occurred_on date,
  updated_at timestamptz,
  user_id uuid
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
    notes.book_id,
    notes.created_at,
    notes.id,
    notes.note,
    notes.occurred_on,
    notes.updated_at,
    notes.user_id
  from public.ledger_day_notes as notes
  where notes.book_id = target_book_id
    and (date_from is null or notes.occurred_on >= date_from)
    and (date_to is null or notes.occurred_on <= date_to)
  order by notes.occurred_on asc;
end;
$$;

create or replace function public.get_ledger_day_notes_in_range(
  target_book_id uuid,
  date_from date default null,
  date_to date default null
)
returns table (
  book_id uuid,
  created_at timestamptz,
  id uuid,
  note text,
  occurred_on date,
  updated_at timestamptz,
  user_id uuid
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_ledger_day_notes_in_range(target_book_id, date_from, date_to);
$$;

revoke all on function public.get_ledger_entry_summaries(uuid, date, date) from public, anon;
revoke all on function public.get_ledger_day_notes_in_range(uuid, date, date) from public, anon;
revoke all on function private.get_ledger_entry_summaries(uuid, date, date) from public, anon;
revoke all on function private.get_ledger_day_notes_in_range(uuid, date, date) from public, anon;

grant execute on function public.get_ledger_entry_summaries(uuid, date, date) to authenticated;
grant execute on function public.get_ledger_day_notes_in_range(uuid, date, date) to authenticated;
grant execute on function private.get_ledger_entry_summaries(uuid, date, date) to authenticated;
grant execute on function private.get_ledger_day_notes_in_range(uuid, date, date) to authenticated;
