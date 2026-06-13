create or replace function private.search_ledger_entries_page(
  target_book_id uuid,
  search_query text,
  category_filter text default null,
  page_limit integer default 31,
  page_offset integer default 0
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
declare
  normalized_query text := trim(coalesce(search_query, ''));
  digit_query text := regexp_replace(coalesce(search_query, ''), '[^0-9]', '', 'g');
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  if normalized_query = '' then
    return;
  end if;

  if not private.is_book_member(target_book_id) then
    raise exception using
      errcode = '42501',
      message = 'Ledger book is not accessible to the current user.';
  end if;

  return query
  with searchable_entries as (
    select
      entries.*,
      regexp_replace(entries.amount::text, '[^0-9]', '', 'g') as amount_digits
    from public.ledger_entries as entries
    where entries.book_id = target_book_id
      and (category_filter is null or entries.category_id = category_filter)
  )
  select
    searchable_entries.book_id,
    searchable_entries.id,
    searchable_entries.user_id,
    searchable_entries.source_type,
    searchable_entries.entry_type,
    searchable_entries.occurred_on,
    searchable_entries.amount,
    searchable_entries.currency,
    searchable_entries.content,
    searchable_entries.category,
    searchable_entries.category_id,
    searchable_entries.installment_group_id,
    searchable_entries.installment_months,
    searchable_entries.installment_order,
    searchable_entries.note,
    searchable_entries.metadata,
    searchable_entries.created_at,
    searchable_entries.updated_at
  from searchable_entries
  where searchable_entries.content ilike '%' || normalized_query || '%'
    or searchable_entries.note ilike '%' || normalized_query || '%'
    or (
      digit_query <> ''
      and searchable_entries.amount_digits like '%' || digit_query || '%'
    )
  order by
    case
      when digit_query <> ''
        and searchable_entries.amount_digits like '%' || digit_query || '%'
        then strpos(searchable_entries.amount_digits, digit_query)
    end asc nulls last,
    searchable_entries.created_at asc,
    searchable_entries.id asc
  limit greatest(page_limit, 0)
  offset greatest(page_offset, 0);
end;
$$;

create or replace function public.search_ledger_entries_page(
  target_book_id uuid,
  search_query text,
  category_filter text default null,
  page_limit integer default 31,
  page_offset integer default 0
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
  from private.search_ledger_entries_page(
    target_book_id,
    search_query,
    category_filter,
    page_limit,
    page_offset
  );
$$;

revoke all on function public.search_ledger_entries_page(uuid, text, text, integer, integer)
from public, anon;
revoke all on function private.search_ledger_entries_page(uuid, text, text, integer, integer)
from public, anon;

grant execute on function public.search_ledger_entries_page(uuid, text, text, integer, integer)
to authenticated;
grant execute on function private.search_ledger_entries_page(uuid, text, text, integer, integer)
to authenticated;
