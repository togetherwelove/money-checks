create or replace function private.replace_ledger_book_system_category_customizations(
  target_book_id uuid,
  target_entry_type text,
  hidden_category_ids text[],
  label_overrides jsonb,
  icon_overrides jsonb
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
    is_hidden
  )
  select
    target_book_id,
    target_entry_type,
    category.category_id,
    nullif(trim(label_overrides ->> category.category_id), ''),
    nullif(trim(icon_overrides ->> category.category_id), ''),
    true,
    category.category_id = any(coalesce(hidden_category_ids, array[]::text[]))
  from (
    select unnest(coalesce(hidden_category_ids, array[]::text[])) as category_id
    union
    select jsonb_object_keys(coalesce(label_overrides, '{}'::jsonb)) as category_id
    union
    select jsonb_object_keys(coalesce(icon_overrides, '{}'::jsonb)) as category_id
  ) as category
  where trim(coalesce(category.category_id, '')) <> '';
end;
$$;

create or replace function public.replace_ledger_book_system_category_customizations(
  target_book_id uuid,
  target_entry_type text,
  hidden_category_ids text[],
  label_overrides jsonb,
  icon_overrides jsonb
)
returns void
language sql
security invoker
set search_path = public, private
as $$
  select private.replace_ledger_book_system_category_customizations(
    target_book_id,
    target_entry_type,
    hidden_category_ids,
    label_overrides,
    icon_overrides
  );
$$;

revoke all on function public.replace_ledger_book_system_category_customizations(
  uuid,
  text,
  text[],
  jsonb,
  jsonb
) from public, anon;
revoke all on function private.replace_ledger_book_system_category_customizations(
  uuid,
  text,
  text[],
  jsonb,
  jsonb
) from public, anon;

grant execute on function public.replace_ledger_book_system_category_customizations(
  uuid,
  text,
  text[],
  jsonb,
  jsonb
) to authenticated;
grant execute on function private.replace_ledger_book_system_category_customizations(
  uuid,
  text,
  text[],
  jsonb,
  jsonb
) to authenticated;
