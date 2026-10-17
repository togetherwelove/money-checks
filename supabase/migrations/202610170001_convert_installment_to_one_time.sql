-- Snapshot-checked conversion: paid rows are never changed.
create or replace function public.convert_installment_to_one_time(
  target_book_id uuid,
  target_group_id text,
  paid_entry_ids uuid[],
  conversion_date date,
  expected_entries jsonb
) returns uuid
language plpgsql security definer set search_path = public, private
as $$
declare
  group_ids uuid[];
  remaining_ids uuid[];
  anchor_id uuid;
  total_amount numeric;
  paid_count integer;
begin
  if auth.uid() is null or private.is_book_editor(target_book_id) is not true then
    raise exception 'Only ledger editors can convert installments';
  end if;
  if conversion_date is null or target_group_id is null or paid_entry_ids is null
    or jsonb_typeof(expected_entries) is distinct from 'array' then
    raise exception 'Conversion date, selection and snapshot are required';
  end if;

  perform id from public.ledger_entries
    where book_id = target_book_id and installment_group_id = target_group_id
    order by id for update;
  select array_agg(id order by occurred_on, installment_order, id)
    into group_ids from public.ledger_entries
    where book_id = target_book_id and installment_group_id = target_group_id;
  if group_ids is null then raise exception 'Installment group not found'; end if;
  if jsonb_array_length(expected_entries) <> cardinality(group_ids)
    or (select count(distinct value->>'id') from jsonb_array_elements(expected_entries)) <> cardinality(group_ids)
    or exists (
      select 1 from public.ledger_entries e where e.id = any(group_ids)
      and not exists (select 1 from jsonb_array_elements(expected_entries) s
        where (s->>'id')::uuid = e.id and (s->>'updated_at')::timestamptz = e.updated_at)
    ) then raise exception 'Installments changed; reload preview'; end if;
  if exists (select 1 from unnest(paid_entry_ids) p where p is null or not (p = any(group_ids))) then
    raise exception 'Paid selection is outside installment group';
  end if;
  if exists (select 1 from public.ledger_entries where id = any(group_ids)
      and (entry_type <> 'expense' or metadata->>'installment_status' = 'PREPAID'))
    or (select count(distinct currency) from public.ledger_entries where id = any(group_ids)) <> 1 then
    raise exception 'Only active same-currency expense installments can be converted';
  end if;

  select array_agg(id order by occurred_on, installment_order, id), sum(amount)
    into remaining_ids, total_amount from public.ledger_entries
    where id = any(group_ids) and not (id = any(paid_entry_ids));
  if remaining_ids is null then raise exception 'No unpaid installments selected'; end if;
  anchor_id := remaining_ids[1];
  paid_count := cardinality(group_ids) - cardinality(remaining_ids);

  -- Copy all affected attachments before deleting any installment rows.
  insert into public.ledger_entry_attachments(user_id, ledger_entry_id, receipt_file_id)
    select distinct on (receipt_file_id) user_id, anchor_id, receipt_file_id
    from public.ledger_entry_attachments
    where installment_group_id = target_group_id or ledger_entry_id = any(remaining_ids)
    order by receipt_file_id, created_at
    on conflict (ledger_entry_id, receipt_file_id) where ledger_entry_id is not null do nothing;

  update public.ledger_entries set
    amount = total_amount, occurred_on = conversion_date,
    installment_group_id = null, installment_months = null, installment_order = null,
    note = regexp_replace(note, '\s*\(\d+/\d+\)$', ''),
    metadata = (coalesce(metadata, '{}'::jsonb) - 'installment_status')
      || jsonb_build_object('converted_installment_group_id', target_group_id)
      || case when paid_count > 0 then jsonb_build_object('installment_status', 'PREPAID') else '{}'::jsonb end
    where id = anchor_id;
  delete from public.ledger_entries where id = any(remaining_ids) and id <> anchor_id;
  if paid_count = 0 then
    delete from public.ledger_entry_attachments where installment_group_id = target_group_id;
  end if;
  return anchor_id;
end;
$$;
revoke all on function public.convert_installment_to_one_time(uuid, text, uuid[], date, jsonb) from public, anon;
grant execute on function public.convert_installment_to_one_time(uuid, text, uuid[], date, jsonb) to authenticated;
