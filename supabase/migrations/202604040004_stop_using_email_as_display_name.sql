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
    ''
  );
$$;

update public.profiles as profiles
set display_name = public.resolve_profile_display_name(users.raw_user_meta_data, users.email)
from auth.users as users
where users.id = profiles.id
  and (
    trim(profiles.display_name) = ''
    or profiles.display_name = users.email
  );
