create table if not exists public.ledger_book_category_customizations (
  book_id uuid not null references public.ledger_books(id) on delete cascade,
  entry_type text not null check (entry_type in ('expense', 'income')),
  category_id text not null,
  label text,
  icon_name text,
  is_system boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (book_id, entry_type, category_id)
);

drop trigger if exists set_ledger_book_category_customizations_updated_at
on public.ledger_book_category_customizations;
create trigger set_ledger_book_category_customizations_updated_at
before update on public.ledger_book_category_customizations
for each row execute function public.set_updated_at();

alter table public.ledger_book_category_customizations enable row level security;
alter table public.ledger_book_category_customizations replica identity full;

drop policy if exists "ledger_book_categories_select_member"
on public.ledger_book_category_customizations;
drop policy if exists "ledger_book_categories_insert_editor"
on public.ledger_book_category_customizations;
drop policy if exists "ledger_book_categories_update_editor"
on public.ledger_book_category_customizations;
drop policy if exists "ledger_book_categories_delete_editor"
on public.ledger_book_category_customizations;

create policy "ledger_book_categories_select_member"
on public.ledger_book_category_customizations
for select using (public.is_book_member(book_id));

create policy "ledger_book_categories_insert_editor"
on public.ledger_book_category_customizations
for insert with check (public.is_book_editor(book_id));

create policy "ledger_book_categories_update_editor"
on public.ledger_book_category_customizations
for update using (public.is_book_editor(book_id))
with check (public.is_book_editor(book_id));

create policy "ledger_book_categories_delete_editor"
on public.ledger_book_category_customizations
for delete using (public.is_book_editor(book_id));

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
    is_hidden
  )
  select
    target_book_id,
    target_entry_type,
    category.id,
    category.label,
    category.icon_name,
    false,
    false
  from jsonb_to_recordset(coalesce(categories, '[]'::jsonb)) as category(
    id text,
    label text,
    icon_name text
  )
  where trim(coalesce(category.id, '')) <> ''
    and trim(coalesce(category.label, '')) <> ''
    and trim(coalesce(category.icon_name, '')) <> '';
end;
$$;

create or replace function public.replace_ledger_book_custom_categories(
  target_book_id uuid,
  target_entry_type text,
  categories jsonb
)
returns void
language sql
security invoker
set search_path = public, private
as $$
  select private.replace_ledger_book_custom_categories(
    target_book_id,
    target_entry_type,
    categories
  );
$$;

create or replace function private.replace_hidden_ledger_book_system_categories(
  target_book_id uuid,
  target_entry_type text,
  hidden_category_ids text[]
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
    is_system,
    is_hidden
  )
  select
    target_book_id,
    target_entry_type,
    hidden_category_id,
    true,
    true
  from unnest(coalesce(hidden_category_ids, array[]::text[])) as hidden_category_id
  where trim(coalesce(hidden_category_id, '')) <> '';
end;
$$;

create or replace function public.replace_hidden_ledger_book_system_categories(
  target_book_id uuid,
  target_entry_type text,
  hidden_category_ids text[]
)
returns void
language sql
security invoker
set search_path = public, private
as $$
  select private.replace_hidden_ledger_book_system_categories(
    target_book_id,
    target_entry_type,
    hidden_category_ids
  );
$$;

revoke all on function public.replace_ledger_book_custom_categories(uuid, text, jsonb)
from public, anon;
revoke all on function private.replace_ledger_book_custom_categories(uuid, text, jsonb)
from public, anon;
revoke all on function public.replace_hidden_ledger_book_system_categories(uuid, text, text[])
from public, anon;
revoke all on function private.replace_hidden_ledger_book_system_categories(uuid, text, text[])
from public, anon;

grant execute on function public.replace_ledger_book_custom_categories(uuid, text, jsonb)
to authenticated;
grant execute on function private.replace_ledger_book_custom_categories(uuid, text, jsonb)
to authenticated;
grant execute on function public.replace_hidden_ledger_book_system_categories(uuid, text, text[])
to authenticated;
grant execute on function private.replace_hidden_ledger_book_system_categories(uuid, text, text[])
to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ledger_book_category_customizations'
  ) then
    execute 'alter publication supabase_realtime add table public.ledger_book_category_customizations';
  end if;
end $$;
