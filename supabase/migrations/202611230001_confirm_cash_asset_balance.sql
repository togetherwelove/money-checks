alter table public.personal_assets add column last_balance_checked_on date;

create function public.confirm_cash_asset_balance(
  p_asset uuid,
  p_book uuid,
  p_expected_balance numeric,
  p_balance numeric
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_current_balance numeric;
  v_checked_on date;
  v_details jsonb;
begin
  if v_user is null or not exists (
    select 1 from public.ledger_book_members
    where book_id = p_book and user_id = v_user and role in ('owner', 'editor')
  ) then raise exception 'Book unavailable'; end if;

  if p_balance is null or p_balance < 0 or p_balance > 9999999999999
    or round(p_balance, 2) <> p_balance then raise exception 'Invalid amount'; end if;

  select current_balance into v_current_balance
  from public.personal_assets
  where id = p_asset and book_id = p_book and user_id = v_user
    and kind = 'cash' and deleted_on is null
  for update;
  if not found then raise exception 'Asset unavailable'; end if;
  if v_current_balance is distinct from p_expected_balance then
    raise sqlstate 'PT409' using message = 'Balance changed';
  end if;

  v_checked_on := (clock_timestamp() at time zone 'Asia/Seoul')::date;
  update public.personal_assets set last_balance_checked_on = v_checked_on where id = p_asset;

  if p_balance <> v_current_balance then
    select details into v_details from public.personal_asset_valuations
    where asset_id = p_asset order by created_at desc, id desc limit 1;
    insert into public.personal_asset_valuations(asset_id, user_id, valued_on, amount, details)
    values (
      p_asset, v_user, v_checked_on, p_balance,
      coalesce(v_details, '{}'::jsonb) || jsonb_build_object('amount', p_balance::text, 'replaceBalance', true)
    );
  end if;
end;
$$;

revoke all on function public.confirm_cash_asset_balance(uuid, uuid, numeric, numeric) from public, anon;
grant execute on function public.confirm_cash_asset_balance(uuid, uuid, numeric, numeric) to authenticated;
