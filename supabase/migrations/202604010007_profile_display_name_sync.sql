create or replace function public.resolve_profile_display_name(
  raw_user_meta_data jsonb,
  fallback_email text
)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(raw_user_meta_data ->> 'name'), ''),
    nullif(trim(raw_user_meta_data ->> 'user_name'), ''),
    nullif(trim(raw_user_meta_data ->> 'preferred_username'), ''),
    nullif(trim(fallback_email), ''),
    ''
  );
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
  next_display_name := public.resolve_profile_display_name(new.raw_user_meta_data, new.email);

  insert into public.profiles (id, display_name)
  values (new.id, next_display_name)
  on conflict (id) do update
    set display_name = case
      when trim(public.profiles.display_name) = '' then excluded.display_name
      when public.profiles.display_name = new.email then excluded.display_name
      else public.profiles.display_name
    end;

  perform public.ensure_personal_ledger_book(new.id, '기본 가계부');

  return new;
end;
$$;

update public.profiles as profiles
set display_name = public.resolve_profile_display_name(users.raw_user_meta_data, users.email)
from auth.users as users
where users.id = profiles.id
  and (
    trim(profiles.display_name) = ''
    or profiles.display_name = users.email
  );
