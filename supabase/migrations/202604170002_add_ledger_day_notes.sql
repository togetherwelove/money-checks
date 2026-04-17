create table if not exists public.ledger_day_notes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.ledger_books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (book_id, occurred_on)
);

drop trigger if exists set_ledger_day_notes_updated_at on public.ledger_day_notes;
create trigger set_ledger_day_notes_updated_at
before update on public.ledger_day_notes
for each row execute function public.set_updated_at();

alter table public.ledger_day_notes enable row level security;
alter table public.ledger_day_notes replica identity full;

drop policy if exists "ledger_day_notes_member_select" on public.ledger_day_notes;
drop policy if exists "ledger_day_notes_editor_insert" on public.ledger_day_notes;
drop policy if exists "ledger_day_notes_editor_update" on public.ledger_day_notes;
drop policy if exists "ledger_day_notes_editor_delete" on public.ledger_day_notes;

create policy "ledger_day_notes_member_select" on public.ledger_day_notes
for select using (public.is_book_member(book_id));

create policy "ledger_day_notes_editor_insert" on public.ledger_day_notes
for insert with check (public.is_book_editor(book_id) and auth.uid() = user_id);

create policy "ledger_day_notes_editor_update" on public.ledger_day_notes
for update using (public.is_book_editor(book_id))
with check (public.is_book_editor(book_id) and auth.uid() = user_id);

create policy "ledger_day_notes_editor_delete" on public.ledger_day_notes
for delete using (public.is_book_editor(book_id));

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
      and tablename = 'ledger_day_notes'
  ) then
    execute 'alter publication supabase_realtime add table public.ledger_day_notes';
  end if;
end;
$$;
