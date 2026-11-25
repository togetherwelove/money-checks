create or replace function private.sync_ledger_asset_movements()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_link jsonb;
  v_old_link jsonb;
  v_cash uuid;
  v_loan uuid;
  v_ids uuid[] := array[]::uuid[];
  v_asset uuid;
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

    v_ids := v_ids || array[(v_old_link->>'cashAssetId')::uuid,(v_old_link->>'loanAssetId')::uuid];
  end if;
  if v_link is not null then
    v_cash := (v_link->>'cashAssetId')::uuid;
    v_loan := (v_link->>'loanAssetId')::uuid;
    v_ids := v_ids || array[v_cash,v_loan];
  end if;
  if tg_op = 'UPDATE' and exists(select 1 from public.personal_assets a where a.id=any(v_ids) and not a.is_shared and a.user_id<>auth.uid())
    and (v_link is distinct from v_old_link or new.book_id<>old.book_id) then raise exception 'Private asset link cannot be changed'; end if;
  -- Same lock order for all accounts prevents concurrent overspending/overpayment.
  perform a.id from public.personal_assets a where a.id = any(v_ids) order by a.id for update;
  if tg_op <> 'INSERT' then
    select min(created_at) into v_stamp from public.ledger_asset_movements where entry_id = old.id;
    delete from public.ledger_asset_movements where entry_id = old.id;
  end if;
  if tg_op <> 'DELETE' and (v_cash is not null or v_loan is not null) then
    if auth.uid() is null or not exists(select 1 from public.ledger_book_members where book_id=new.book_id and user_id=auth.uid() and role in ('owner','editor')) then raise exception 'Book unavailable'; end if;
    if new.currency <> 'KRW' or new.installment_group_id is not null then
      raise exception 'Only KRW one-time transactions can link assets';
    end if;
    foreach v_asset in array array[v_cash,v_loan] loop
      if v_asset is null then continue; end if;
      if not exists(select 1 from public.personal_assets a where a.id = v_asset and a.book_id = new.book_id and a.deleted_on is null and (a.user_id = auth.uid() or a.is_shared or (tg_op = 'UPDATE' and new.book_id=old.book_id and v_link is not distinct from v_old_link))
        and a.kind = case when v_asset = v_cash then 'cash' else 'loan' end) or
        private.personal_asset_balance(v_asset) is null then raise exception 'Asset is unavailable on this date'; end if;
    end loop;
    if v_cash is not null then
      insert into public.ledger_asset_movements(asset_id,user_id,entry_id,amount,occurred_on,created_at)
      select v_cash,a.user_id,new.id,case when new.entry_type = 'expense' then -new.amount else new.amount end,new.occurred_on,coalesce(v_stamp,clock_timestamp()) from public.personal_assets a where a.id=v_cash;
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
      select v_loan,a.user_id,new.id,-v_principal,new.occurred_on,coalesce(v_stamp,clock_timestamp()) from public.personal_assets a where a.id=v_loan;
    end if;
  end if;
  -- Only the final current balances matter, including reversals of old entries.
  if exists(select 1 from public.personal_assets where id=any(v_ids) and current_balance < 0) then
    raise exception 'Insufficient cash or loan balance';
  end if;
  return null;
end;
$$;
