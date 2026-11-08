-- Only expose the existence of a loan, never another member's private asset details.
create or replace function public.has_ledger_book_loans(p_book uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ledger_book_members
    where book_id = p_book and user_id = auth.uid()
  ) and exists (
    select 1 from public.personal_assets
    where book_id = p_book and kind = 'loan' and deleted_on is null
  );
$$;
revoke all on function public.has_ledger_book_loans(uuid) from public, anon;
grant execute on function public.has_ledger_book_loans(uuid) to authenticated;

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

  if target_entry_type = 'expense'
    and public.has_ledger_book_loans(target_book_id)
    and not exists (
      select 1 from jsonb_to_recordset(coalesce(categories, '[]'::jsonb))
        as category(id text, label text, icon_name text)
      where category.id = 'custom-category-loan-repayment'
        and trim(coalesce(category.label, '')) <> ''
        and trim(coalesce(category.icon_name, '')) <> ''
    ) then
    raise exception 'Loan repayment category is required while loans are registered';
  end if;

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

