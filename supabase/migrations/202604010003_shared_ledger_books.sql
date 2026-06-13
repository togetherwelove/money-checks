create table if not exists public.ledger_books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '기본 가계부',
  share_code text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ledger_book_members (
  book_id uuid not null references public.ledger_books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')) default 'editor',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (book_id, user_id)
);

create or replace function public.generate_share_code()
returns text
language plpgsql
as $$
declare
  next_code text;
begin
  loop
    next_code := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text || random()::text), 1, 8));
    exit when not exists (
      select 1
      from public.ledger_books
      where share_code = next_code
    );
  end loop;

  return next_code;
end;
$$;

alter table public.ledger_books
  alter column share_code set default public.generate_share_code();

update public.ledger_books
set share_code = public.generate_share_code()
where share_code is null;

alter table public.ledger_books
  alter column share_code set not null;

alter table public.profiles
  add column if not exists active_book_id uuid references public.ledger_books(id) on delete set null;

alter table public.ledger_entries
  add column if not exists book_id uuid references public.ledger_books(id) on delete cascade;

create or replace function public.ensure_personal_ledger_book(
  target_user_id uuid,
  target_book_name text default '기본 가계부'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_book_id uuid;
begin
  select members.book_id
  into existing_book_id
  from public.ledger_book_members as members
  where members.user_id = target_user_id
    and members.role = 'owner'
  order by members.created_at
  limit 1;

  if existing_book_id is null then
    insert into public.ledger_books (owner_id, name, share_code)
    values (target_user_id, target_book_name, public.generate_share_code())
    returning id into existing_book_id;

    insert into public.ledger_book_members (book_id, user_id, role)
    values (existing_book_id, target_user_id, 'owner')
    on conflict (book_id, user_id) do nothing;
  end if;

  update public.profiles
  set active_book_id = coalesce(active_book_id, existing_book_id)
  where id = target_user_id;

  return existing_book_id;
end;
$$;

create or replace function public.is_book_member(target_book_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = target_book_id
      and members.user_id = auth.uid()
  );
$$;

create or replace function public.is_book_editor(target_book_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.ledger_book_members as members
    where members.book_id = target_book_id
      and members.user_id = auth.uid()
      and members.role in ('owner', 'editor')
  );
$$;

create or replace function public.join_ledger_book_by_code(input_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  target_book_id uuid;
begin
  normalized_code := upper(trim(input_code));

  select books.id
  into target_book_id
  from public.ledger_books as books
  where books.share_code = normalized_code;

  if target_book_id is null then
    raise exception 'Ledger book not found for code %', normalized_code;
  end if;

  insert into public.ledger_book_members (book_id, user_id, role)
  values (target_book_id, auth.uid(), 'editor')
  on conflict (book_id, user_id) do nothing;

  update public.profiles
  set active_book_id = target_book_id
  where id = auth.uid();

  return target_book_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_display_name text;
begin
  next_display_name := coalesce(new.raw_user_meta_data ->> 'name', new.email, '');

  insert into public.profiles (id, display_name)
  values (new.id, next_display_name)
  on conflict (id) do update
    set display_name = excluded.display_name;

  perform public.ensure_personal_ledger_book(new.id, '기본 가계부');

  return new;
end;
$$;

insert into public.profiles (id, display_name)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'name', users.email, '')
from auth.users as users
on conflict (id) do nothing;

select public.ensure_personal_ledger_book(profiles.id, '기본 가계부')
from public.profiles as profiles;

update public.ledger_entries as entries
set book_id = members.book_id
from public.ledger_book_members as members
where members.user_id = entries.user_id
  and members.role = 'owner'
  and entries.book_id is null;

alter table public.ledger_entries
  alter column book_id set not null;

drop trigger if exists set_ledger_books_updated_at on public.ledger_books;
create trigger set_ledger_books_updated_at
before update on public.ledger_books
for each row execute function public.set_updated_at();

alter table public.ledger_books enable row level security;
alter table public.ledger_book_members enable row level security;

drop policy if exists "ledger_entries_own_all" on public.ledger_entries;
drop policy if exists "ledger_books_select_member" on public.ledger_books;
drop policy if exists "ledger_book_members_select_member" on public.ledger_book_members;
drop policy if exists "ledger_entries_member_select" on public.ledger_entries;
drop policy if exists "ledger_entries_editor_insert" on public.ledger_entries;
drop policy if exists "ledger_entries_editor_update" on public.ledger_entries;
drop policy if exists "ledger_entries_editor_delete" on public.ledger_entries;

create policy "ledger_books_select_member" on public.ledger_books
for select using (public.is_book_member(id));

create policy "ledger_book_members_select_member" on public.ledger_book_members
for select using (public.is_book_member(book_id));

create policy "ledger_entries_member_select" on public.ledger_entries
for select using (public.is_book_member(book_id));

create policy "ledger_entries_editor_insert" on public.ledger_entries
for insert with check (public.is_book_editor(book_id) and auth.uid() = user_id);

create policy "ledger_entries_editor_update" on public.ledger_entries
for update using (public.is_book_editor(book_id))
with check (public.is_book_editor(book_id));

create policy "ledger_entries_editor_delete" on public.ledger_entries
for delete using (public.is_book_editor(book_id));

grant execute on function public.join_ledger_book_by_code(text) to authenticated;
