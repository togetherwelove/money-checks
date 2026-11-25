-- Preserve today's effective balances before replacing date-based calculation.
alter table public.personal_assets add column current_balance numeric not null default 0;
update public.personal_assets set current_balance = coalesce(
  private.personal_asset_balance(id, (now() at time zone 'Asia/Seoul')::date), 0
);

create table public.asset_monthly_snapshots (
  asset_id uuid not null references public.personal_assets(id) on delete cascade,
  book_id uuid not null references public.ledger_books(id) on delete cascade,
  month_end date not null,
  kind text not null,
  amount numeric not null,
  primary key (asset_id, month_end)
);
alter table public.asset_monthly_snapshots enable row level security;
revoke all on public.asset_monthly_snapshots from public, anon, authenticated;
grant select on public.asset_monthly_snapshots to authenticated;
create policy asset_monthly_snapshots_read on public.asset_monthly_snapshots
  for select to authenticated using (private.can_read_book_asset(asset_id));
create index asset_monthly_snapshots_book_month_idx on public.asset_monthly_snapshots(book_id, month_end);

-- No historical backfill: only months since this feature was enabled can close.
create table private.asset_snapshot_checkpoint (
  singleton boolean primary key default true check (singleton),
  open_month date not null
);
insert into private.asset_snapshot_checkpoint(open_month)
values(date_trunc('month', now() at time zone 'Asia/Seoul')::date);
revoke all on private.asset_snapshot_checkpoint from public, anon, authenticated;

create function private.close_asset_months() returns void
language plpgsql security definer set search_path='' as $$
declare v_month date; v_current_month date;
begin
  select open_month into v_month from private.asset_snapshot_checkpoint where singleton for update;
  v_current_month := date_trunc('month', now() at time zone 'Asia/Seoul')::date;
  while v_month < v_current_month loop
    insert into public.asset_monthly_snapshots(asset_id, book_id, month_end, kind, amount)
    select id, book_id, (v_month + interval '1 month' - interval '1 day')::date, kind, current_balance
    from public.personal_assets where deleted_on is null
    on conflict do nothing;
    v_month := (v_month + interval '1 month')::date;
  end loop;
  update private.asset_snapshot_checkpoint set open_month=v_month where singleton;
end $$;
revoke all on function private.close_asset_months() from public, anon, authenticated;

-- Close the prior month before any mutation, even when the scheduler is late.
create function private.close_asset_months_before_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform private.close_asset_months();
  return new;
end $$;
revoke all on function private.close_asset_months_before_change() from public, anon, authenticated;
create trigger close_asset_months_before_change before insert or update on public.personal_assets
for each row execute function private.close_asset_months_before_change();

-- The movement table keeps identity for edits/deletes; dates no longer drive balances.
create function private.apply_current_asset_movement() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op = 'DELETE' then
    update public.personal_assets set current_balance=current_balance-old.amount where id=old.asset_id;
  else
    update public.personal_assets set current_balance=current_balance+new.amount where id=new.asset_id;
  end if;
  return null;
end $$;
revoke all on function private.apply_current_asset_movement() from public, anon, authenticated;
create trigger apply_current_asset_movement after insert or delete on public.ledger_asset_movements
for each row execute function private.apply_current_asset_movement();

-- Older clients may supply a date; it no longer changes the result.
create or replace function private.personal_asset_balance(p_asset uuid, p_date date default current_date)
returns numeric language sql stable security definer set search_path='' as $$
  select current_balance from public.personal_assets where id=p_asset;
$$;

-- A manual amount replaces the current balance; old ledger effects stay reversible.
create or replace function private.validate_asset_balance_checkpoint() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  update public.personal_assets set current_balance=new.amount where id=new.asset_id;
  return new;
end $$;
