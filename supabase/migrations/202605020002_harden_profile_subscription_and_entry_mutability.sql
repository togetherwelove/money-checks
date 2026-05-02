create or replace function public.update_own_profile_display_name(next_display_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_display_name text;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  normalized_display_name := regexp_replace(trim(coalesce(next_display_name, '')), '\s+', ' ', 'g');
  if normalized_display_name = '' then
    raise exception 'Display name is required';
  end if;

  update public.profiles
  set display_name = normalized_display_name
  where id = current_user_id;

  if not found then
    raise exception 'Profile was not found';
  end if;

  return normalized_display_name;
end;
$$;

create or replace function public.prevent_client_subscription_tier_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.subscription_tier is distinct from new.subscription_tier
    and coalesce(auth.role(), '') <> 'service_role'
    and current_user not in ('postgres', 'supabase_admin', 'service_role')
  then
    raise exception 'subscription_tier can only be updated by a trusted server process';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_client_subscription_tier_update on public.profiles;
create trigger prevent_client_subscription_tier_update
before update on public.profiles
for each row execute function public.prevent_client_subscription_tier_update();

create or replace function public.prevent_ledger_entry_identity_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.user_id is distinct from new.user_id then
    raise exception 'ledger entry user_id cannot be changed';
  end if;

  if old.book_id is distinct from new.book_id then
    raise exception 'ledger entry book_id cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_ledger_entry_identity_update on public.ledger_entries;
create trigger prevent_ledger_entry_identity_update
before update on public.ledger_entries
for each row execute function public.prevent_ledger_entry_identity_update();

drop policy if exists "profiles_update_own" on public.profiles;

create table if not exists public.function_invocation_locks (
  function_name text primary key,
  last_invoked_at timestamptz not null default timezone('utc', now())
);

alter table public.function_invocation_locks enable row level security;

create or replace function public.try_acquire_function_invocation_lock(
  target_function_name text,
  minimum_interval interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.function_invocation_locks (function_name)
  values (target_function_name)
  on conflict (function_name) do nothing;

  if found then
    return true;
  end if;

  update public.function_invocation_locks
  set last_invoked_at = timezone('utc', now())
  where function_name = target_function_name
    and last_invoked_at <= timezone('utc', now()) - minimum_interval;

  return found;
end;
$$;

revoke all on function public.update_own_profile_display_name(text) from public;
revoke all on function public.prevent_client_subscription_tier_update() from public;
revoke all on function public.prevent_ledger_entry_identity_update() from public;
revoke all on function public.try_acquire_function_invocation_lock(text, interval) from public;
revoke all on table public.function_invocation_locks from public;

grant execute on function public.update_own_profile_display_name(text) to authenticated;
grant execute on function public.try_acquire_function_invocation_lock(text, interval) to service_role;
grant select, insert, update on table public.function_invocation_locks to service_role;
