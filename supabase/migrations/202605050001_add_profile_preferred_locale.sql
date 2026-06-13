alter table public.profiles
  add column if not exists preferred_locale text not null default 'ko';

alter table public.profiles
  drop constraint if exists profiles_preferred_locale_check;

alter table public.profiles
  add constraint profiles_preferred_locale_check
  check (preferred_locale in ('ko', 'en'));

create or replace function private.update_own_profile_preferred_locale(next_locale text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_locale text := lower(trim(coalesce(next_locale, '')));
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if normalized_locale not in ('ko', 'en') then
    raise exception 'Unsupported locale %', next_locale
      using errcode = '22023';
  end if;

  insert into public.profiles (id, preferred_locale)
  values (current_user_id, normalized_locale)
  on conflict on constraint profiles_pkey do update
    set preferred_locale = excluded.preferred_locale;

  return normalized_locale;
end;
$$;

create or replace function public.update_own_profile_preferred_locale(next_locale text)
returns text
language sql
security invoker
set search_path = public, private
as $$
  select private.update_own_profile_preferred_locale(next_locale);
$$;

revoke execute on function private.update_own_profile_preferred_locale(text) from public, anon;
revoke execute on function public.update_own_profile_preferred_locale(text) from public, anon;
grant execute on function public.update_own_profile_preferred_locale(text) to authenticated;
