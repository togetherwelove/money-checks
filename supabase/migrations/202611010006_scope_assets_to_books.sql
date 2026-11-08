-- Assets belong to a book, remain owned by their creator, and are private by default.
alter table public.personal_assets add column book_id uuid references public.ledger_books(id) on delete cascade;
alter table public.personal_assets add column is_shared boolean not null default false;
-- Refuse ambiguous legacy links rather than silently dropping or exposing history.
do $$
begin
  if exists(select 1 from public.ledger_asset_movements m join public.ledger_entries e on e.id=m.entry_id group by m.asset_id having count(distinct e.book_id)>1) then
    raise exception 'Legacy asset spans multiple books; reconcile before migration';
  end if;
end $$;
update public.personal_assets a set book_id=(select e.book_id from public.ledger_asset_movements m join public.ledger_entries e on e.id=m.entry_id where m.asset_id=a.id limit 1);
update public.personal_assets a set book_id=public.ensure_personal_ledger_book(a.user_id, U&'\AE30\BCF8 \AC00\ACC4\BD80') where book_id is null;
alter table public.personal_assets alter column book_id set not null;
create index personal_assets_book_idx on public.personal_assets(book_id);
-- Scope history queries without duplicating private data in client-side filters.
alter table public.personal_asset_valuations add column book_id uuid references public.ledger_books(id) on delete cascade;
alter table public.ledger_asset_movements add column book_id uuid references public.ledger_books(id) on delete cascade;
update public.personal_asset_valuations v set book_id=a.book_id from public.personal_assets a where a.id=v.asset_id;
update public.ledger_asset_movements m set book_id=a.book_id from public.personal_assets a where a.id=m.asset_id;
alter table public.personal_asset_valuations alter column book_id set not null;
alter table public.ledger_asset_movements alter column book_id set not null;
create function private.set_asset_history_book() returns trigger language plpgsql security definer set search_path='' as $$
begin
  select book_id into new.book_id from public.personal_assets where id=new.asset_id;
  return new;
end $$;
revoke all on function private.set_asset_history_book() from public,anon,authenticated;
create trigger set_asset_valuation_book before insert on public.personal_asset_valuations for each row execute function private.set_asset_history_book();
create trigger set_asset_movement_book before insert on public.ledger_asset_movements for each row execute function private.set_asset_history_book();
create function private.can_read_book_asset(p_asset uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.personal_assets a join public.ledger_book_members m on m.book_id=a.book_id
    where a.id=p_asset and m.user_id=auth.uid() and (a.user_id=auth.uid() or a.is_shared));
$$;
revoke all on function private.can_read_book_asset(uuid) from public,anon;
grant execute on function private.can_read_book_asset(uuid) to authenticated;
drop policy personal_assets_read on public.personal_assets;
create policy personal_assets_read on public.personal_assets for select to authenticated using (private.can_read_book_asset(id));
drop policy personal_asset_valuations_read on public.personal_asset_valuations;
create policy personal_asset_valuations_read on public.personal_asset_valuations for select to authenticated using (private.can_read_book_asset(asset_id));
drop policy ledger_asset_movements_read on public.ledger_asset_movements;
create policy ledger_asset_movements_read on public.ledger_asset_movements for select to authenticated using (private.can_read_book_asset(asset_id));
-- Replace the legacy RPC with a scoped compatibility wrapper below.
drop function public.save_personal_asset(uuid,text,text,text,date,jsonb);
create or replace function public.save_personal_asset(p_id uuid, p_kind text, p_name text, p_note text, p_date date, p_details jsonb, p_book uuid, p_shared boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_id uuid := p_id;
  v_amount numeric;
  v_share numeric;
begin
  if v_user is null or not exists(select 1 from public.ledger_book_members where book_id=p_book and user_id=v_user and role in ('owner','editor')) then raise exception 'Book unavailable'; end if;
  if p_date is null or p_date > (now() at time zone 'Asia/Seoul')::date or p_date < date '1900-01-01' then
    raise exception 'Invalid valuation date';
  end if;
  if p_details is null or jsonb_typeof(p_details) <> 'object' or pg_column_size(p_details) > 16384 then
    raise exception 'Invalid asset details';
  end if;
  if p_kind = 'stock' then
    if (p_details->>'quantity')::numeric < 0 or (p_details->>'quantity')::numeric > 1000000000
      or (p_details->>'unitPrice')::numeric < 0 or (p_details->>'unitPrice')::numeric > 9999999999999 then
      raise exception 'Invalid holding';
    end if;
    v_amount := (p_details->>'quantity')::numeric * (p_details->>'unitPrice')::numeric;
  elsif p_kind = 'property' then
    v_share := (p_details->>'share')::numeric;
    if v_share is null or v_share <= 0 or v_share > 100 or (p_details->>'amount')::numeric < 0
      or (p_details->>'amount')::numeric > 9999999999999 then raise exception 'Invalid ownership'; end if;
    v_amount := (p_details->>'amount')::numeric * v_share / 100;
  else
    v_amount := (p_details->>'amount')::numeric;
  end if;
  if v_amount is null or v_amount::text in ('NaN', 'Infinity', '-Infinity') or v_amount < 0 or v_amount > 9999999999999 then
    raise exception 'Invalid amount';
  end if;
  if p_id is null then
    insert into public.personal_assets(user_id, kind, name, note, book_id, is_shared)
    values(v_user, p_kind, trim(p_name), p_note, p_book, p_shared) returning id into v_id;
  else
    -- Row locking serializes updates and deletion of a holding.
    perform 1 from public.personal_assets where id = p_id and user_id = v_user and deleted_on is null and kind = p_kind and book_id=p_book for update;
    if not found then raise exception 'Asset unavailable'; end if;
    update public.personal_assets set name = trim(p_name), note = p_note, is_shared=p_shared where id = p_id;
  end if;
  if nullif(p_details->>'defaultCashAssetId','') is not null and not exists(
    select 1 from public.personal_assets where id=(p_details->>'defaultCashAssetId')::uuid and book_id=p_book
    and kind='cash' and deleted_on is null and (user_id=v_user or is_shared)
    and (not p_shared or is_shared)
  ) then raise exception 'Default cash asset unavailable'; end if;
  insert into public.personal_asset_valuations(asset_id, user_id, valued_on, amount, details)
  values(v_id, v_user, p_date, round(v_amount, 2), p_details);
  return v_id;
end;
$$;

create or replace function private.sync_ledger_asset_movements()
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
    if new.currency <> 'KRW' or new.installment_group_id is not null or new.occurred_on > (now() at time zone 'Asia/Seoul')::date then
      raise exception 'Only posted KRW transactions can link assets';
    end if;
    foreach v_asset in array array[v_cash,v_loan] loop
      if v_asset is null then continue; end if;
      if not exists(select 1 from public.personal_assets a where a.id = v_asset and a.book_id = new.book_id and a.deleted_on is null and (a.user_id = auth.uid() or a.is_shared or (tg_op = 'UPDATE' and new.book_id=old.book_id and v_link is not distinct from v_old_link))
        and a.kind = case when v_asset = v_cash then 'cash' else 'loan' end) or
        private.personal_asset_balance(v_asset,new.occurred_on) is null then raise exception 'Asset is unavailable on this date'; end if;
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
create or replace function public.ensure_loan_repayment_category(p_book uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.ledger_book_members where book_id=p_book and user_id=auth.uid()) then return; end if;
  if not exists(select 1 from public.personal_assets where book_id=p_book and (user_id=auth.uid() or is_shared) and kind='loan' and deleted_on is null) then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_book::text || ':expense:custom_categories',0));
  insert into public.ledger_book_category_customizations(book_id,entry_type,category_id,label,icon_name,is_system,is_hidden)
  values(p_book,'expense','custom-category-loan-repayment','대출 상환','credit-card',false,false)
  on conflict(book_id,entry_type,category_id) do nothing;
end;
$$;
revoke all on function public.ensure_loan_repayment_category(uuid) from public, anon;
grant execute on function public.ensure_loan_repayment_category(uuid) to authenticated;

create or replace function private.add_repayment_category_for_loan()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_book uuid;
begin
  if new.kind = 'loan' and new.deleted_on is null then
    for v_book in select new.book_id loop
      perform public.ensure_loan_repayment_category(v_book);
    end loop;
  end if;
  return null;
end;
$$;
revoke all on function private.add_repayment_category_for_loan() from public, anon, authenticated;
create or replace function public.delete_asset_linked_entry(p_entry uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_entry public.ledger_entries%rowtype; v_files uuid[]; v_storage jsonb;
begin
  select * into v_entry from public.ledger_entries where id = p_entry for update;
  if not found or auth.uid() is null or
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

revoke all on function public.save_personal_asset(uuid,text,text,text,date,jsonb,uuid,boolean) from public,anon;
grant execute on function public.save_personal_asset(uuid,text,text,text,date,jsonb,uuid,boolean) to authenticated;

-- Older app versions may still call the original signature. Preserve privacy and ownership.
create function public.save_personal_asset(p_id uuid,p_kind text,p_name text,p_note text,p_date date,p_details jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_book uuid; v_shared boolean := false;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_id is null then
    v_book := public.ensure_personal_ledger_book(auth.uid(), U&'\AE30\BCF8 \AC00\ACC4\BD80');
  else
    select book_id,is_shared into v_book,v_shared from public.personal_assets where id=p_id and user_id=auth.uid();
    if not found then raise exception 'Asset unavailable'; end if;
  end if;
  return public.save_personal_asset(p_id,p_kind,p_name,p_note,p_date,p_details,v_book,v_shared);
end $$;
revoke all on function public.save_personal_asset(uuid,text,text,text,date,jsonb) from public,anon;
grant execute on function public.save_personal_asset(uuid,text,text,text,date,jsonb) to authenticated;
