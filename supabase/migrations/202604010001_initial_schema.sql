create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  default_currency text not null default 'KRW',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('manual', 'receipt', 'notification', 'sms')),
  entry_type text not null check (entry_type in ('income', 'expense')),
  occurred_on date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'KRW',
  category text not null default '',
  note text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.raw_text_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('notification', 'sms', 'manual_text')),
  source_title text not null default '',
  source_sender text not null default '',
  raw_text text not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  classification_status text not null default 'pending'
    check (classification_status in ('pending', 'processed', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classification_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text_event_id uuid references public.raw_text_events(id) on delete set null,
  ledger_entry_id uuid references public.ledger_entries(id) on delete set null,
  model_name text not null default '',
  inferred_category text not null default '',
  extracted_amount numeric(12, 2),
  confidence numeric(5, 4) not null default 0,
  explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.receipt_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null default '',
  content_type text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_ledger_entries_updated_at on public.ledger_entries;
create trigger set_ledger_entries_updated_at
before update on public.ledger_entries
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.raw_text_events enable row level security;
alter table public.classification_results enable row level security;
alter table public.receipt_files enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "ledger_entries_own_all" on public.ledger_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "raw_text_events_own_all" on public.raw_text_events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "classification_results_own_all" on public.classification_results
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "receipt_files_own_all" on public.receipt_files
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
