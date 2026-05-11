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

  insert into public.profiles (id, display_name)
  values (current_user_id, normalized_display_name)
  on conflict on constraint profiles_pkey do update
    set display_name = excluded.display_name;

  return normalized_display_name;
end;
$$;

grant execute on function public.update_own_profile_display_name(text) to authenticated;
