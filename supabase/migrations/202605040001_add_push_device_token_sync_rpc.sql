create schema if not exists private;

grant usage on schema private to authenticated;
revoke usage on schema private from public, anon;

create or replace function private.sync_push_device_token(
  next_expo_push_token text,
  next_platform text,
  previous_expo_push_token text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '28000';
  end if;

  if nullif(trim(next_expo_push_token), '') is null then
    raise exception 'Expo push token is required.'
      using errcode = '22023';
  end if;

  if next_platform not in ('android', 'ios') then
    raise exception 'Unsupported push token platform.'
      using errcode = '22023';
  end if;

  if previous_expo_push_token is not null
    and previous_expo_push_token <> next_expo_push_token then
    delete from public.push_device_tokens
    where expo_push_token = previous_expo_push_token
      and user_id = current_user_id;
  end if;

  delete from public.push_device_tokens
  where expo_push_token = next_expo_push_token
    and user_id <> current_user_id;

  insert into public.push_device_tokens (
    expo_push_token,
    platform,
    user_id
  )
  values (
    next_expo_push_token,
    next_platform,
    current_user_id
  )
  on conflict (expo_push_token) do update
  set
    platform = excluded.platform,
    user_id = excluded.user_id,
    updated_at = timezone('utc', now());
end;
$$;

revoke execute on function private.sync_push_device_token(text, text, text) from public, anon;
grant execute on function private.sync_push_device_token(text, text, text) to authenticated;

create or replace function public.sync_push_device_token(
  next_expo_push_token text,
  next_platform text,
  previous_expo_push_token text default null
)
returns void
language sql
security invoker
set search_path = public, private
as $$
  select private.sync_push_device_token(
    next_expo_push_token,
    next_platform,
    previous_expo_push_token
  );
$$;

revoke execute on function public.sync_push_device_token(text, text, text) from public, anon;
grant execute on function public.sync_push_device_token(text, text, text) to authenticated;
