drop function if exists public.get_ledger_entry_summaries(uuid, date, date);
drop function if exists private.get_ledger_entry_summaries(uuid, date, date);

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
  installment_group_id text,
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
  installment_group_id text,
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

revoke all on function public.get_ledger_entry_summaries(uuid, date, date) from public, anon;
revoke all on function private.get_ledger_entry_summaries(uuid, date, date) from public, anon;

grant execute on function public.get_ledger_entry_summaries(uuid, date, date) to authenticated;
grant execute on function private.get_ledger_entry_summaries(uuid, date, date) to authenticated;
