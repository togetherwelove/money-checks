create table if not exists public.push_device_tokens (
  expo_push_token text primary key,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled_by_event jsonb not null default '{}'::jsonb,
  threshold_periods jsonb not null default '{}'::jsonb,
  thresholds jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_push_device_tokens_updated_at on public.push_device_tokens;
create trigger set_push_device_tokens_updated_at
before update on public.push_device_tokens
for each row execute function public.set_updated_at();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.push_device_tokens enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "push_device_tokens_select_own" on public.push_device_tokens;
drop policy if exists "push_device_tokens_insert_own" on public.push_device_tokens;
drop policy if exists "push_device_tokens_update_own" on public.push_device_tokens;
drop policy if exists "push_device_tokens_delete_own" on public.push_device_tokens;
drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
drop policy if exists "notification_preferences_update_own" on public.notification_preferences;

create policy "push_device_tokens_select_own" on public.push_device_tokens
for select using (auth.uid() = user_id);

create policy "push_device_tokens_insert_own" on public.push_device_tokens
for insert with check (auth.uid() = user_id);

create policy "push_device_tokens_update_own" on public.push_device_tokens
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "push_device_tokens_delete_own" on public.push_device_tokens
for delete using (auth.uid() = user_id);

create policy "notification_preferences_select_own" on public.notification_preferences
for select using (auth.uid() = user_id);

create policy "notification_preferences_insert_own" on public.notification_preferences
for insert with check (auth.uid() = user_id);

create policy "notification_preferences_update_own" on public.notification_preferences
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);
