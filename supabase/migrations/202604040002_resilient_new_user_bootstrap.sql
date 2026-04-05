create or replace function public.ensure_own_personal_ledger_book()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  return public.ensure_personal_ledger_book(auth.uid(), '기본 가계부');
end;
$$;

revoke all on function public.ensure_own_personal_ledger_book() from public;
grant execute on function public.ensure_own_personal_ledger_book() to authenticated;

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

  begin
    perform public.ensure_personal_ledger_book(new.id, '기본 가계부');
  exception
    when others then
      null;
  end;

  return new;
end;
$$;
