-- Movement rows are private; ledger amounts and their asset effects commit atomically.
create table public.ledger_asset_movements (
  asset_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.ledger_entries(id) on delete cascade,
  amount numeric(15,2) not null,
  occurred_on date not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (asset_id, entry_id),
  foreign key (asset_id, user_id) references public.personal_assets(id,user_id) on delete cascade
);
create index ledger_asset_movements_owner_idx on public.ledger_asset_movements(user_id,occurred_on);
alter table public.ledger_asset_movements enable row level security;
create policy ledger_asset_movements_read on public.ledger_asset_movements for select to authenticated
using (user_id = (select auth.uid()));
revoke all on public.ledger_asset_movements from anon, authenticated;
grant select on public.ledger_asset_movements to authenticated;

create function private.personal_asset_balance(p_asset uuid, p_date date)
returns numeric language sql stable security definer set search_path = '' as $$
  select v.amount + coalesce((
    select sum(m.amount) from public.ledger_asset_movements m
    where m.asset_id = p_asset and m.occurred_on <= p_date and
      (m.occurred_on > v.valued_on or (m.occurred_on = v.valued_on and m.created_at > v.created_at))
  ),0)
  from public.personal_asset_valuations v
  where v.asset_id = p_asset and v.valued_on <= p_date
  order by v.valued_on desc, v.created_at desc limit 1;
$$;
revoke all on function private.personal_asset_balance(uuid,date) from public, anon, authenticated;

create function private.sync_ledger_asset_movements()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_link jsonb;
  v_old_link jsonb;
  v_cash uuid;
  v_loan uuid;
  v_ids uuid[] := array[]::uuid[];
  v_asset uuid;
  v_date date;
  v_principal numeric;
  v_fee numeric;
  v_stamp timestamptz;
begin
  if tg_op <> 'INSERT' then v_old_link := nullif(old.metadata->'asset_link','null'::jsonb); end if;
  if tg_op <> 'DELETE' then v_link := nullif(new.metadata->'asset_link','null'::jsonb); end if;
  if v_link is null and v_old_link is null then return null; end if;
  if tg_op = 'UPDATE' and v_link is not distinct from v_old_link and
    (new.amount,new.occurred_on,new.entry_type,new.currency,new.category_id,new.installment_group_id,new.book_id) is not distinct from
    (old.amount,old.occurred_on,old.entry_type,old.currency,old.category_id,old.installment_group_id,old.book_id) then return null; end if;

  if v_old_link is not null then
    if auth.uid() is not null and old.user_id is distinct from auth.uid() then raise exception 'Only the entry owner can change asset links'; end if;
    v_ids := v_ids || array[(v_old_link->>'cashAssetId')::uuid,(v_old_link->>'loanAssetId')::uuid];
  end if;
  if v_link is not null then
    v_cash := (v_link->>'cashAssetId')::uuid;
    v_loan := (v_link->>'loanAssetId')::uuid;
    v_ids := v_ids || array[v_cash,v_loan];
  end if;
  -- Same lock order for all accounts prevents concurrent overspending/overpayment.
  perform a.id from public.personal_assets a where a.id = any(v_ids) order by a.id for update;
  if tg_op <> 'INSERT' then
    select min(created_at) into v_stamp from public.ledger_asset_movements where entry_id = old.id;
    delete from public.ledger_asset_movements where entry_id = old.id;
  end if;
  if tg_op <> 'DELETE' and (v_cash is not null or v_loan is not null) then
    if auth.uid() is null or new.user_id is distinct from auth.uid() then raise exception 'Only the entry owner can change asset links'; end if;
    if not exists(select 1 from public.ledger_books b where b.id = new.book_id and b.owner_id = auth.uid()) or
      exists(select 1 from public.ledger_book_members b where b.book_id = new.book_id and b.user_id <> auth.uid()) then
      raise exception 'Asset links require a personal ledger';
    end if;
    if new.currency <> 'KRW' or new.installment_group_id is not null or new.occurred_on > (now() at time zone 'Asia/Seoul')::date then
      raise exception 'Only posted KRW transactions can link assets';
    end if;
    foreach v_asset in array array[v_cash,v_loan] loop
      if v_asset is null then continue; end if;
      if not exists(select 1 from public.personal_assets a where a.id = v_asset and a.user_id = auth.uid() and a.deleted_on is null
        and a.kind = case when v_asset = v_cash then 'cash' else 'loan' end) or
        private.personal_asset_balance(v_asset,new.occurred_on) is null then raise exception 'Asset is unavailable on this date'; end if;
    end loop;
    if v_cash is not null then
      insert into public.ledger_asset_movements(asset_id,user_id,entry_id,amount,occurred_on,created_at)
      values(v_cash,auth.uid(),new.id,case when new.entry_type = 'expense' then -new.amount else new.amount end,new.occurred_on,coalesce(v_stamp,clock_timestamp()));
    end if;
    if v_loan is not null then
      v_principal := (v_link->>'principal')::numeric;
      v_fee := (v_link->>'fee')::numeric;
      if new.entry_type <> 'expense' or new.category_id <> 'custom-category-loan-repayment' or
        v_principal is null or v_fee is null or v_principal::text in ('NaN','Infinity','-Infinity') or
        v_fee::text in ('NaN','Infinity','-Infinity') or v_principal < 0 or v_fee < 0 or
        v_principal + v_fee > new.amount or round(v_principal,2) <> v_principal or round(v_fee,2) <> v_fee then
        raise exception 'Invalid repayment principal or fee';
      end if;
      insert into public.ledger_asset_movements(asset_id,user_id,entry_id,amount,occurred_on,created_at)
      values(v_loan,auth.uid(),new.id,-v_principal,new.occurred_on,coalesce(v_stamp,clock_timestamp()));
    end if;
  end if;
  -- Validate subsequent dates as well, including removal of earlier income entries.
  foreach v_asset in array v_ids loop
    if v_asset is null then continue; end if;
    for v_date in
      select occurred_on from public.ledger_asset_movements where asset_id = v_asset
      union select valued_on from public.personal_asset_valuations where asset_id = v_asset
    loop
      if private.personal_asset_balance(v_asset,v_date) < 0 then raise exception 'Insufficient cash or loan balance'; end if;
    end loop;
  end loop;
  return null;
end;
$$;
revoke all on function private.sync_ledger_asset_movements() from public, anon, authenticated;
create trigger sync_ledger_asset_movements after insert or update or delete on public.ledger_entries
for each row execute function private.sync_ledger_asset_movements();

-- Preserve existing categories and add one stable repayment category per personal book.
create function public.ensure_loan_repayment_category(p_book uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.ledger_books where id = p_book and owner_id = auth.uid()) or
    exists(select 1 from public.ledger_book_members where book_id = p_book and user_id <> auth.uid()) then return; end if;
  if not exists(select 1 from public.personal_assets where user_id = auth.uid() and kind = 'loan' and deleted_on is null) then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_book::text || ':expense:custom_categories',0));
  insert into public.ledger_book_category_customizations(book_id,entry_type,category_id,label,icon_name,is_system,is_hidden)
  values(p_book,'expense','custom-category-loan-repayment','대출 상환','credit-card',false,false)
  on conflict(book_id,entry_type,category_id) do nothing;
end;
$$;
revoke all on function public.ensure_loan_repayment_category(uuid) from public, anon;
grant execute on function public.ensure_loan_repayment_category(uuid) to authenticated;

create function private.add_repayment_category_for_loan()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_book uuid;
begin
  if new.kind = 'loan' and new.deleted_on is null then
    for v_book in select id from public.ledger_books where owner_id = new.user_id loop
      perform public.ensure_loan_repayment_category(v_book);
    end loop;
  end if;
  return null;
end;
$$;
revoke all on function private.add_repayment_category_for_loan() from public, anon, authenticated;
create trigger add_repayment_category_for_loan after insert on public.personal_assets
for each row execute function private.add_repayment_category_for_loan();

create function private.validate_asset_balance_checkpoint()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_date date;
begin
  perform id from public.personal_assets where id = new.asset_id for update;
  for v_date in select occurred_on from public.ledger_asset_movements where asset_id = new.asset_id and occurred_on >= new.valued_on
  loop
    if private.personal_asset_balance(new.asset_id,v_date) < 0 then raise exception 'Checkpoint would overdraw later transactions'; end if;
  end loop;
  return null;
end;
$$;
revoke all on function private.validate_asset_balance_checkpoint() from public, anon, authenticated;
create trigger validate_asset_balance_checkpoint after insert on public.personal_asset_valuations
for each row execute function private.validate_asset_balance_checkpoint();

create function public.delete_asset_linked_entry(p_entry uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_entry public.ledger_entries%rowtype; v_files uuid[]; v_storage jsonb;
begin
  select * into v_entry from public.ledger_entries where id = p_entry for update;
  if not found or auth.uid() is null or v_entry.user_id is distinct from auth.uid() or
    not exists(select 1 from public.ledger_book_members where book_id = v_entry.book_id and user_id = auth.uid() and role in ('owner','editor')) or
    v_entry.metadata->'asset_link' is null then raise exception 'Linked entry is not editable'; end if;
  select coalesce(array_agg(distinct f.id),'{}'::uuid[]),
    coalesce(jsonb_agg(distinct jsonb_build_object('storage_bucket',f.storage_bucket,'storage_path',f.storage_path)),'[]'::jsonb)
    into v_files,v_storage
    from public.receipt_files f join public.ledger_entry_attachments a on a.receipt_file_id = f.id
    where a.ledger_entry_id = p_entry and not exists(
      select 1 from public.ledger_entry_attachments other where other.receipt_file_id = f.id and other.id <> a.id
    );
  delete from public.ledger_entries where id = p_entry;
  delete from public.receipt_files where id = any(v_files);
  return v_storage;
end;
$$;
revoke all on function public.delete_asset_linked_entry(uuid) from public, anon;
grant execute on function public.delete_asset_linked_entry(uuid) to authenticated;
