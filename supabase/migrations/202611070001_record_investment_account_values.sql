-- Accept account totals while retaining compatibility with older holding records.
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
  if p_kind = 'stock' and nullif(btrim(p_details->>'amount'),'') is null then
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
