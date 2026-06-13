create or replace function private.get_enriched_ledger_entries(
  target_book_id uuid,
  date_from date default null,
  date_to date default null,
  category_filter text default null,
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
security definer
set search_path = public, private
as $$
declare
  normalized_search_query text := trim(coalesce(search_query, ''));
  digit_search_query text := regexp_replace(coalesce(search_query, ''), '[^0-9]', '', 'g');
  target_member_id_pattern constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  if not private.is_book_member(target_book_id) then
    raise exception using
      errcode = '42501',
      message = 'Ledger book is not accessible to the current user.';
  end if;

  if order_by_column not in ('created_at', 'occurred_on') then
    raise exception using
      errcode = '22023',
      message = 'Unsupported ledger entry order column.';
  end if;

  return query
  with filtered_entries as (
    select
      entries.*,
      coalesce(
        entries.target_member_id,
        case
          when (entries.metadata ->> 'target_member_id') ~* target_member_id_pattern
            then (entries.metadata ->> 'target_member_id')::uuid
          else entries.user_id
        end
      ) as resolved_target_member_id,
      regexp_replace(entries.amount::text, '[^0-9]', '', 'g') as amount_digits
    from public.ledger_entries as entries
    where entries.book_id = target_book_id
      and (date_from is null or entries.occurred_on >= date_from)
      and (date_to is null or entries.occurred_on <= date_to)
      and (category_filter is null or entries.category_id = category_filter)
      and (
        installment_group_filter is null
        or entries.installment_group_id = installment_group_filter
      )
      and (
        normalized_search_query = ''
        or entries.content ilike '%' || normalized_search_query || '%'
        or entries.note ilike '%' || normalized_search_query || '%'
        or (
          digit_search_query <> ''
          and regexp_replace(entries.amount::text, '[^0-9]', '', 'g')
            like '%' || digit_search_query || '%'
        )
      )
      and (
        page_cursor_created_at is null
        or page_cursor_id is null
        or order_by_column <> 'created_at'
        or (
          order_ascending
          and (entries.created_at, entries.id) > (page_cursor_created_at, page_cursor_id)
        )
        or (
          not order_ascending
          and (entries.created_at, entries.id) < (page_cursor_created_at, page_cursor_id)
        )
      )
  )
  select
    filtered_entries.book_id,
    filtered_entries.id,
    filtered_entries.user_id,
    filtered_entries.source_type,
    filtered_entries.entry_type,
    filtered_entries.occurred_on,
    filtered_entries.amount,
    filtered_entries.currency,
    filtered_entries.content,
    filtered_entries.category,
    filtered_entries.category_id,
    filtered_entries.installment_group_id,
    filtered_entries.installment_months,
    filtered_entries.installment_order,
    filtered_entries.note,
    filtered_entries.metadata,
    filtered_entries.created_at,
    filtered_entries.updated_at,
    author_profiles.display_name as author_display_name,
    target_profiles.display_name as target_member_display_name,
    exists (
      select 1
      from public.ledger_book_members as members
      where members.book_id = filtered_entries.book_id
        and members.user_id = filtered_entries.user_id
    ) as author_has_book_access,
    exists (
      select 1
      from public.ledger_book_members as members
      where members.book_id = filtered_entries.book_id
        and members.user_id = filtered_entries.resolved_target_member_id
    ) as target_member_has_book_access,
    coalesce(entry_attachments.photo_attachments, '[]'::jsonb) as photo_attachments
  from filtered_entries
  left join public.profiles as author_profiles
    on author_profiles.id = filtered_entries.user_id
  left join public.profiles as target_profiles
    on target_profiles.id = filtered_entries.resolved_target_member_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', receipt_files.id,
        'content_type', receipt_files.content_type,
        'original_filename', receipt_files.original_filename,
        'storage_bucket', receipt_files.storage_bucket,
        'storage_path', receipt_files.storage_path
      )
      order by attachment_rows.created_at asc, attachment_rows.id asc
    ) as photo_attachments
    from public.ledger_entry_attachments as attachment_rows
    join public.receipt_files as receipt_files
      on receipt_files.id = attachment_rows.receipt_file_id
    where attachment_rows.user_id = auth.uid()
      and (
        attachment_rows.ledger_entry_id = filtered_entries.id
        or (
          filtered_entries.installment_group_id is not null
          and attachment_rows.installment_group_id = filtered_entries.installment_group_id
        )
      )
  ) as entry_attachments on true
  order by
    case
      when digit_search_query <> ''
        and filtered_entries.amount_digits like '%' || digit_search_query || '%'
        then strpos(filtered_entries.amount_digits, digit_search_query)
    end asc nulls last,
    case
      when order_by_column = 'occurred_on' and order_ascending
        then filtered_entries.occurred_on
    end asc,
    case
      when order_by_column = 'occurred_on' and not order_ascending
        then filtered_entries.occurred_on
    end desc,
    case
      when order_by_column = 'created_at' and order_ascending
        then filtered_entries.created_at
    end asc,
    case
      when order_by_column = 'created_at' and not order_ascending
        then filtered_entries.created_at
    end desc,
    case
      when order_ascending
        then filtered_entries.id
    end asc,
    case
      when not order_ascending
        then filtered_entries.id
    end desc
  limit case
    when page_limit is null then null
    else greatest(page_limit, 0)
  end
  offset greatest(coalesce(page_offset, 0), 0);
end;
$$;

create or replace function public.get_enriched_ledger_entries(
  target_book_id uuid,
  date_from date default null,
  date_to date default null,
  category_filter text default null,
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
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_enriched_ledger_entries(
    target_book_id,
    date_from,
    date_to,
    category_filter,
    installment_group_filter,
    search_query,
    order_by_column,
    order_ascending,
    page_limit,
    page_offset,
    page_cursor_created_at,
    page_cursor_id
  );
$$;

revoke all on function public.get_enriched_ledger_entries(
  uuid,
  date,
  date,
  text,
  text,
  text,
  text,
  boolean,
  integer,
  integer,
  timestamptz,
  uuid
) from public, anon;

revoke all on function private.get_enriched_ledger_entries(
  uuid,
  date,
  date,
  text,
  text,
  text,
  text,
  boolean,
  integer,
  integer,
  timestamptz,
  uuid
) from public, anon;

grant execute on function public.get_enriched_ledger_entries(
  uuid,
  date,
  date,
  text,
  text,
  text,
  text,
  boolean,
  integer,
  integer,
  timestamptz,
  uuid
) to authenticated;

grant execute on function private.get_enriched_ledger_entries(
  uuid,
  date,
  date,
  text,
  text,
  text,
  text,
  boolean,
  integer,
  integer,
  timestamptz,
  uuid
) to authenticated;
