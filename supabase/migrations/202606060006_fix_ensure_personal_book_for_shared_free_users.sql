create or replace function public.ensure_personal_ledger_book(
  target_user_id uuid,
  target_book_name text default '기본 가계부'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_book_id uuid;
  created_at_value timestamptz := timezone('utc', now());
begin
  if target_user_id is null then
    raise exception 'Target user is required.';
  end if;

  select members.book_id
  into existing_book_id
  from public.ledger_book_members as members
  where members.user_id = target_user_id
    and members.role = 'owner'
  order by members.created_at, members.book_id
  limit 1;

  if existing_book_id is null then
    select members.book_id
    into existing_book_id
    from public.ledger_book_members as members
    where members.user_id = target_user_id
    order by members.created_at, members.book_id
    limit 1;
  end if;

  if existing_book_id is null then
    insert into public.ledger_books (
      owner_id,
      name,
      share_code,
      share_code_created_at,
      share_code_expires_at
    )
    values (
      target_user_id,
      target_book_name,
      public.generate_share_code(),
      created_at_value,
      created_at_value + public.share_code_time_to_live()
    )
    returning id into existing_book_id;

    insert into public.ledger_book_members (book_id, user_id, role)
    values (existing_book_id, target_user_id, 'owner')
    on conflict (book_id, user_id) do nothing;
  end if;

  update public.profiles as profiles
  set active_book_id = existing_book_id
  where profiles.id = target_user_id
    and (
      profiles.active_book_id is null
      or not exists (
        select 1
        from public.ledger_book_members as active_membership
        where active_membership.user_id = target_user_id
          and active_membership.book_id = profiles.active_book_id
      )
    );

  return existing_book_id;
end;
$$;

create or replace function private.ensure_own_personal_ledger_book()
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

create or replace function private.get_active_ledger_book()
returns table (
  id uuid,
  name text,
  owner_id uuid,
  share_code text
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_user_id uuid := auth.uid();
  next_active_book_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = current_user_id
  ) then
    insert into public.profiles (id)
    values (current_user_id);
  end if;

  select profile.active_book_id
  into next_active_book_id
  from public.profiles as profile
  where profile.id = current_user_id;

  if next_active_book_id is null
    or not exists (
      select 1
      from public.ledger_book_members as members
      where members.user_id = current_user_id
        and members.book_id = next_active_book_id
    )
  then
    next_active_book_id := private.ensure_own_personal_ledger_book();
  end if;

  return query
  select book.id, book.name, book.owner_id, book.share_code
  from public.get_accessible_ledger_book(next_active_book_id) as book;
end;
$$;

grant execute on function private.ensure_own_personal_ledger_book() to authenticated;
grant execute on function private.get_active_ledger_book() to authenticated;
