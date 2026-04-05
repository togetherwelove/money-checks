alter table public.ledger_books
  alter column share_code_created_at set default timezone('utc', now()),
  alter column share_code_expires_at set default (
    timezone('utc', now()) + public.share_code_time_to_live()
  );

update public.ledger_books
set share_code_created_at = coalesce(share_code_created_at, timezone('utc', now()))
where share_code_created_at is null;

update public.ledger_books
set share_code_expires_at = coalesce(
  share_code_expires_at,
  share_code_created_at + public.share_code_time_to_live()
)
where share_code_expires_at is null;

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
  select members.book_id
  into existing_book_id
  from public.ledger_book_members as members
  where members.user_id = target_user_id
    and members.role = 'owner'
  order by members.created_at
  limit 1;

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

  update public.profiles
  set active_book_id = coalesce(active_book_id, existing_book_id)
  where id = target_user_id;

  return existing_book_id;
end;
$$;
