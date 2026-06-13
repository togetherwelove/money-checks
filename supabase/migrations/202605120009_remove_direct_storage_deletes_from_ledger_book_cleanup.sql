create or replace function private.list_ledger_book_receipt_files(target_book_id uuid)
returns table (
  storage_bucket text,
  storage_path text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_owner_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required';
  end if;

  select books.owner_id
  into target_owner_id
  from public.ledger_books as books
  where books.id = target_book_id;

  if target_owner_id is null then
    raise exception 'Ledger book % was not found', target_book_id;
  end if;

  if target_owner_id <> current_user_id then
    raise exception 'Only the owner can list receipt files for this ledger book';
  end if;

  return query
  select distinct
    receipt_files.storage_bucket,
    receipt_files.storage_path
  from public.ledger_entries as entries
  join public.ledger_entry_attachments as attachments
    on attachments.ledger_entry_id = entries.id
    or (
      attachments.installment_group_id is not null
      and attachments.installment_group_id = entries.installment_group_id
    )
  join public.receipt_files as receipt_files
    on receipt_files.id = attachments.receipt_file_id
  where entries.book_id = target_book_id;
end;
$$;

create or replace function public.list_ledger_book_receipt_files(target_book_id uuid)
returns table (
  storage_bucket text,
  storage_path text
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.list_ledger_book_receipt_files(target_book_id);
$$;

create or replace function private.delete_receipt_files_for_owned_personal_ledgers(
  source_owner_id uuid,
  target_book_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.receipt_files as receipt_files
  using (
    select distinct receipt_files.id
    from public.ledger_books as books
    join public.ledger_entries as entries
      on entries.book_id = books.id
    join public.ledger_entry_attachments as attachments
      on attachments.ledger_entry_id = entries.id
      or (
        attachments.installment_group_id is not null
        and attachments.installment_group_id = entries.installment_group_id
      )
    join public.receipt_files as receipt_files
      on receipt_files.id = attachments.receipt_file_id
    where books.owner_id = source_owner_id
      and books.id <> target_book_id
  ) as target_files
  where receipt_files.id = target_files.id;
end;
$$;

create or replace function private.delete_receipt_files_for_ledger_book(target_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.receipt_files as receipt_files
  using (
    select distinct receipt_files.id
    from public.ledger_entries as entries
    join public.ledger_entry_attachments as attachments
      on attachments.ledger_entry_id = entries.id
      or (
        attachments.installment_group_id is not null
        and attachments.installment_group_id = entries.installment_group_id
      )
    join public.receipt_files as receipt_files
      on receipt_files.id = attachments.receipt_file_id
    where entries.book_id = target_book_id
  ) as target_files
  where receipt_files.id = target_files.id;
end;
$$;

revoke execute on function private.list_ledger_book_receipt_files(uuid)
from public, anon, authenticated;
revoke execute on function public.list_ledger_book_receipt_files(uuid)
from public, anon;
grant execute on function private.list_ledger_book_receipt_files(uuid) to authenticated;
grant execute on function public.list_ledger_book_receipt_files(uuid) to authenticated;
