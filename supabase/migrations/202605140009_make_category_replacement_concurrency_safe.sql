create or replace function private.replace_ledger_book_custom_categories(
  target_book_id uuid,
  target_entry_type text,
  categories jsonb
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  if target_entry_type not in ('expense', 'income') then
    raise exception 'Invalid entry type %', target_entry_type;
  end if;

  if not private.is_book_editor(target_book_id) then
    raise exception using
      errcode = '42501',
      message = 'Ledger book is not editable by the current user.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(target_book_id::text || ':' || target_entry_type || ':custom_categories', 0)
  );

  delete from public.ledger_book_category_customizations as customizations
  where customizations.book_id = target_book_id
    and customizations.entry_type = target_entry_type
    and customizations.is_system = false;

  insert into public.ledger_book_category_customizations (
    book_id,
    entry_type,
    category_id,
    label,
    icon_name,
    is_system,
    is_hidden,
    sort_order
  )
  select
    target_book_id,
    target_entry_type,
    category.id,
    category.label,
    category.icon_name,
    false,
    false,
    category.sort_order
  from (
    select distinct on (record.id)
      record.id,
      record.label,
      record.icon_name,
      record.sort_order
    from jsonb_to_recordset(coalesce(categories, '[]'::jsonb)) as record(
      id text,
      label text,
      icon_name text,
      sort_order integer
    )
    where trim(coalesce(record.id, '')) <> ''
      and trim(coalesce(record.label, '')) <> ''
      and trim(coalesce(record.icon_name, '')) <> ''
    order by record.id, record.sort_order nulls last
  ) as category
  on conflict (book_id, entry_type, category_id) do update
  set
    label = excluded.label,
    icon_name = excluded.icon_name,
    is_system = excluded.is_system,
    is_hidden = excluded.is_hidden,
    sort_order = excluded.sort_order,
    updated_at = timezone('utc', now());
end;
$$;

create or replace function private.replace_ledger_book_system_category_customizations(
  target_book_id uuid,
  target_entry_type text,
  hidden_category_ids text[],
  label_overrides jsonb,
  icon_overrides jsonb,
  category_order_ids text[]
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  if target_entry_type not in ('expense', 'income') then
    raise exception 'Invalid entry type %', target_entry_type;
  end if;

  if not private.is_book_editor(target_book_id) then
    raise exception using
      errcode = '42501',
      message = 'Ledger book is not editable by the current user.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(target_book_id::text || ':' || target_entry_type || ':system_categories', 0)
  );

  delete from public.ledger_book_category_customizations as customizations
  where customizations.book_id = target_book_id
    and customizations.entry_type = target_entry_type
    and customizations.is_system = true;

  insert into public.ledger_book_category_customizations (
    book_id,
    entry_type,
    category_id,
    label,
    icon_name,
    is_system,
    is_hidden,
    sort_order
  )
  select
    target_book_id,
    target_entry_type,
    category.category_id,
    nullif(trim(label_overrides ->> category.category_id), ''),
    nullif(trim(icon_overrides ->> category.category_id), ''),
    true,
    category.category_id = any(coalesce(hidden_category_ids, array[]::text[])),
    array_position(coalesce(category_order_ids, array[]::text[]), category.category_id) - 1
  from (
    select distinct on (candidate.category_id)
      candidate.category_id
    from (
      select unnest(coalesce(hidden_category_ids, array[]::text[])) as category_id
      union all
      select jsonb_object_keys(coalesce(label_overrides, '{}'::jsonb)) as category_id
      union all
      select jsonb_object_keys(coalesce(icon_overrides, '{}'::jsonb)) as category_id
      union all
      select unnest(coalesce(category_order_ids, array[]::text[])) as category_id
    ) as candidate
    where trim(coalesce(candidate.category_id, '')) <> ''
      and candidate.category_id not like 'custom-category-%'
    order by candidate.category_id
  ) as category
  on conflict (book_id, entry_type, category_id) do update
  set
    label = excluded.label,
    icon_name = excluded.icon_name,
    is_system = excluded.is_system,
    is_hidden = excluded.is_hidden,
    sort_order = excluded.sort_order,
    updated_at = timezone('utc', now());
end;
$$;
