create or replace function public.get_enriched_ledger_entries_v2(
  target_book_id uuid,
  date_from date default null,
  date_to date default null,
  category_filters text[] default null,
  installment_group_filter text default null,
  search_query text default null,
  order_by_column text default 'occurred_on',
  order_ascending boolean default true,
  page_limit integer default null,
  page_offset integer default 0,
  page_cursor_created_at timestamptz default null,
  page_cursor_id uuid default null
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
  target_member_display_name text,
  author_has_book_access boolean,
  target_member_has_book_access boolean,
  photo_attachments jsonb
)
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  normalized_category_filters text[] := (
    select coalesce(
      array_agg(distinct trim(selected_categories.category_id)),
      array[null::text]
    )
    from unnest(category_filters) as selected_categories(category_id)
    where nullif(trim(selected_categories.category_id), '') is not null
  );
  normalized_page_offset integer := greatest(coalesce(page_offset, 0), 0);
  per_category_limit integer := case
    when page_limit is null then null
    else greatest(page_limit, 0) + greatest(coalesce(page_offset, 0), 0)
  end;
  normalized_search_query text := trim(coalesce(search_query, ''));
  digit_search_query text := regexp_replace(coalesce(search_query, ''), '[^0-9]', '', 'g');
begin
  if order_by_column not in ('created_at', 'occurred_on') then
    raise exception using
      errcode = '22023',
      message = 'Unsupported ledger entry order column.';
  end if;

  return query
  with category_rows as (
    select entry_rows.*
    from unnest(normalized_category_filters) as selected_categories(category_id)
    cross join lateral private.get_enriched_ledger_entries(
      target_book_id,
      date_from,
      date_to,
      selected_categories.category_id,
      installment_group_filter,
      normalized_search_query,
      order_by_column,
      order_ascending,
      per_category_limit,
      0,
      page_cursor_created_at,
      page_cursor_id
    ) as entry_rows
  )
  select
    category_rows.book_id,
    category_rows.id,
    category_rows.user_id,
    category_rows.source_type,
    category_rows.entry_type,
    category_rows.occurred_on,
    category_rows.amount,
    category_rows.currency,
    category_rows.content,
    category_rows.category,
    category_rows.category_id,
    category_rows.installment_group_id,
    category_rows.installment_months,
    category_rows.installment_order,
    category_rows.note,
    category_rows.metadata,
    category_rows.created_at,
    category_rows.updated_at,
    category_rows.author_display_name,
    category_rows.target_member_display_name,
    category_rows.author_has_book_access,
    category_rows.target_member_has_book_access,
    category_rows.photo_attachments
  from category_rows
  order by
    case
      when digit_search_query <> ''
        and regexp_replace(category_rows.amount::text, '[^0-9]', '', 'g')
          like '%' || digit_search_query || '%'
        then strpos(
          regexp_replace(category_rows.amount::text, '[^0-9]', '', 'g'),
          digit_search_query
        )
    end asc nulls last,
    case
      when order_by_column = 'occurred_on' and order_ascending
        then category_rows.occurred_on
    end asc,
    case
      when order_by_column = 'occurred_on' and not order_ascending
        then category_rows.occurred_on
    end desc,
    case
      when order_by_column = 'created_at' and order_ascending
        then category_rows.created_at
    end asc,
    case
      when order_by_column = 'created_at' and not order_ascending
        then category_rows.created_at
    end desc,
    case
      when order_ascending
        then category_rows.id
    end asc,
    case
      when not order_ascending
        then category_rows.id
    end desc
  limit case
    when page_limit is null then null
    else greatest(page_limit, 0)
  end
  offset normalized_page_offset;
end;
$$;
