alter table public.profiles
  alter column default_currency set default 'KRW';

alter table public.profiles
  drop constraint if exists profiles_default_currency_check;

alter table public.profiles
  add constraint profiles_default_currency_check
  check (default_currency in ('KRW', 'USD'));

create or replace function private.update_own_profile_default_currency(next_currency text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_currency text := upper(trim(coalesce(next_currency, '')));
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if normalized_currency not in ('KRW', 'USD') then
    raise exception 'Unsupported currency %', next_currency
      using errcode = '22023';
  end if;

  insert into public.profiles (id, default_currency)
  values (current_user_id, normalized_currency)
  on conflict on constraint profiles_pkey do update
    set default_currency = excluded.default_currency;

  return normalized_currency;
end;
$$;

create or replace function public.update_own_profile_default_currency(next_currency text)
returns text
language sql
security invoker
set search_path = public, private
as $$
  select private.update_own_profile_default_currency(next_currency);
$$;

revoke execute on function private.update_own_profile_default_currency(text) from public, anon;
revoke execute on function public.update_own_profile_default_currency(text) from public, anon;
grant execute on function private.update_own_profile_default_currency(text) to authenticated;
grant execute on function public.update_own_profile_default_currency(text) to authenticated;
