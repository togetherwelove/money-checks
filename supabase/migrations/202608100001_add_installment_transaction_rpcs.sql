create or replace function private.delete_installment_group(
  target_book_id uuid,
  target_installment_group_id text
)
returns table (
  deleted_entry_ids uuid[],
  receipt_files jsonb
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_entry_ids uuid[];
  target_receipt_file_ids uuid[];
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  if target_book_id is null or nullif(trim(target_installment_group_id), '') is null then
    raise exception 'Ledger book and installment group are required';
  end if;

  if private.is_book_editor(target_book_id) is not true then
    raise exception 'Only ledger book editors can delete installment entries';
  end if;

  perform entries.id
  from public.ledger_entries as entries
  where entries.book_id = target_book_id
    and entries.installment_group_id = target_installment_group_id
  for update;

  if not found then
    raise exception 'Installment group was not found';
  end if;

  select coalesce(array_agg(entries.id order by entries.occurred_on, entries.id), '{}'::uuid[])
  into target_entry_ids
  from public.ledger_entries as entries
  where entries.book_id = target_book_id
    and entries.installment_group_id = target_installment_group_id;

  select
    coalesce(array_agg(distinct files.id), '{}'::uuid[]),
    coalesce(
      jsonb_agg(
        distinct jsonb_build_object(
          'storage_bucket', files.storage_bucket,
          'storage_path', files.storage_path
        )
      ),
      '[]'::jsonb
    )
  into target_receipt_file_ids, receipt_files
  from public.ledger_entry_attachments as attachments
  join public.receipt_files as files
    on files.id = attachments.receipt_file_id
  where (
      attachments.installment_group_id = target_installment_group_id
      or attachments.ledger_entry_id = any(target_entry_ids)
    )
    and not exists (
      select 1
      from public.ledger_entry_attachments as other_attachments
      where other_attachments.receipt_file_id = attachments.receipt_file_id
        and not (
          coalesce(
            other_attachments.installment_group_id = target_installment_group_id,
            false
          )
          or coalesce(other_attachments.ledger_entry_id = any(target_entry_ids), false)
        )
    );

  delete from public.ledger_entry_attachments as attachments
  where attachments.installment_group_id = target_installment_group_id
    or attachments.ledger_entry_id = any(target_entry_ids);

  if cardinality(target_receipt_file_ids) > 0 then
    delete from public.receipt_files as files
    where files.id = any(target_receipt_file_ids);
  end if;

  delete from public.ledger_entries as entries
  where entries.id = any(target_entry_ids);

  deleted_entry_ids := target_entry_ids;
  return next;
end;
$$;

create or replace function public.delete_installment_group(
  target_book_id uuid,
  target_installment_group_id text
)
returns table (
  deleted_entry_ids uuid[],
  receipt_files jsonb
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.delete_installment_group(target_book_id, target_installment_group_id);
$$;

create or replace function private.prepay_installment_group(
  target_book_id uuid,
  target_installment_group_id text,
  prepayment_date date
)
returns table (
  deleted_entry_ids uuid[],
  prepaid_entry_id uuid,
  prepaid_installment_count integer,
  prepaid_amount numeric,
  receipt_files jsonb
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  source_entry public.ledger_entries%rowtype;
  target_receipt_file_ids uuid[];
  updated_metadata jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  if target_book_id is null
    or nullif(trim(target_installment_group_id), '') is null
    or prepayment_date is null then
    raise exception 'Ledger book, installment group, and prepayment date are required';
  end if;

  if private.is_book_editor(target_book_id) is not true then
    raise exception 'Only ledger book editors can prepay installment entries';
  end if;

  perform entries.id
  from public.ledger_entries as entries
  where entries.book_id = target_book_id
    and entries.installment_group_id = target_installment_group_id
  for update;

  if not found then
    raise exception 'Installment group was not found';
  end if;

  if exists (
    select 1
    from public.ledger_entries as entries
    where entries.book_id = target_book_id
      and entries.installment_group_id = target_installment_group_id
      and entries.metadata ->> 'installment_status' = 'PREPAID'
  ) then
    raise exception 'Installment group is already prepaid';
  end if;

  if exists (
    select 1
    from public.ledger_entries as entries
    where entries.book_id = target_book_id
      and entries.installment_group_id = target_installment_group_id
      and entries.entry_type <> 'expense'
  ) then
    raise exception 'Only expense installment groups can be prepaid';
  end if;

  select entries.*
  into source_entry
  from public.ledger_entries as entries
  where entries.book_id = target_book_id
    and entries.installment_group_id = target_installment_group_id
    and entries.occurred_on <= prepayment_date
  order by entries.occurred_on desc, entries.installment_order desc nulls last, entries.id
  limit 1;

  if source_entry.id is null then
    select entries.*
    into source_entry
    from public.ledger_entries as entries
    where entries.book_id = target_book_id
      and entries.installment_group_id = target_installment_group_id
    order by entries.occurred_on, entries.installment_order nulls last, entries.id
    limit 1;
  end if;

  select
    coalesce(array_agg(entries.id order by entries.occurred_on, entries.id), '{}'::uuid[]),
    count(*)::integer,
    coalesce(sum(entries.amount), 0)
  into deleted_entry_ids, prepaid_installment_count, prepaid_amount
  from public.ledger_entries as entries
  where entries.book_id = target_book_id
    and entries.installment_group_id = target_installment_group_id
    and entries.occurred_on > prepayment_date;

  if prepaid_installment_count = 0 then
    raise exception 'No future installment entries are available for prepayment';
  end if;

  select
    coalesce(array_agg(distinct files.id), '{}'::uuid[]),
    coalesce(
      jsonb_agg(
        distinct jsonb_build_object(
          'storage_bucket', files.storage_bucket,
          'storage_path', files.storage_path
        )
      ),
      '[]'::jsonb
    )
  into target_receipt_file_ids, receipt_files
  from public.ledger_entry_attachments as attachments
  join public.receipt_files as files
    on files.id = attachments.receipt_file_id
  where attachments.ledger_entry_id = any(deleted_entry_ids)
    and not exists (
      select 1
      from public.ledger_entry_attachments as other_attachments
      where other_attachments.receipt_file_id = attachments.receipt_file_id
        and not coalesce(
          other_attachments.ledger_entry_id = any(deleted_entry_ids),
          false
        )
    );

  delete from public.ledger_entry_attachments as attachments
  where attachments.ledger_entry_id = any(deleted_entry_ids);

  if cardinality(target_receipt_file_ids) > 0 then
    delete from public.receipt_files as files
    where files.id = any(target_receipt_file_ids);
  end if;

  update public.ledger_entries as entries
  set metadata = jsonb_set(
    coalesce(entries.metadata, '{}'::jsonb),
    '{installment_status}',
    to_jsonb('PREPAID'::text),
    true
  )
  where entries.book_id = target_book_id
    and entries.installment_group_id = target_installment_group_id
    and entries.occurred_on <= prepayment_date;

  delete from public.ledger_entries as entries
  where entries.id = any(deleted_entry_ids);

  updated_metadata := jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          coalesce(source_entry.metadata, '{}'::jsonb),
          '{installment_status}',
          to_jsonb('PREPAID'::text),
          true
        ),
        '{is_installment_prepayment_entry}',
        'true'::jsonb,
        true
      ),
      '{installment_prepaid_at}',
      to_jsonb(prepayment_date::text),
      true
    ),
    '{prepaid_installment_count}',
    to_jsonb(prepaid_installment_count),
    true
  );

  insert into public.ledger_entries (
    book_id,
    user_id,
    source_type,
    entry_type,
    occurred_on,
    amount,
    currency,
    content,
    category,
    category_id,
    installment_group_id,
    installment_months,
    installment_order,
    note,
    metadata
  )
  values (
    target_book_id,
    auth.uid(),
    'manual',
    source_entry.entry_type,
    prepayment_date,
    prepaid_amount,
    source_entry.currency,
    source_entry.content,
    source_entry.category,
    source_entry.category_id,
    target_installment_group_id,
    source_entry.installment_months,
    null,
    regexp_replace(source_entry.note, '\s*\(\d+/\d+\)$', ''),
    updated_metadata
  )
  returning id into prepaid_entry_id;

  return next;
end;
$$;

create or replace function public.prepay_installment_group(
  target_book_id uuid,
  target_installment_group_id text,
  prepayment_date date
)
returns table (
  deleted_entry_ids uuid[],
  prepaid_entry_id uuid,
  prepaid_installment_count integer,
  prepaid_amount numeric,
  receipt_files jsonb
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.prepay_installment_group(
    target_book_id,
    target_installment_group_id,
    prepayment_date
  );
$$;

revoke all on function private.delete_installment_group(uuid, text)
  from public, anon;
revoke all on function public.delete_installment_group(uuid, text)
  from public, anon;
revoke all on function private.prepay_installment_group(uuid, text, date)
  from public, anon;
revoke all on function public.prepay_installment_group(uuid, text, date)
  from public, anon;

grant execute on function private.delete_installment_group(uuid, text)
  to authenticated;
grant execute on function public.delete_installment_group(uuid, text)
  to authenticated;
grant execute on function private.prepay_installment_group(uuid, text, date)
  to authenticated;
grant execute on function public.prepay_installment_group(uuid, text, date)
  to authenticated;
