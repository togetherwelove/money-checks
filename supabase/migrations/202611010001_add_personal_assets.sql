-- Personal assets are intentionally independent of ledger-book membership.
create table public.personal_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('cash','bank','savings','stock','investment','property','deposit','car','other','loan','installment','deposit-debt')),
  name text not null check (length(trim(name)) between 1 and 80),
  note text not null default '' check (length(note) <= 1000),
  deleted_on date,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index personal_assets_owner_idx on public.personal_assets(user_id);

create table public.personal_asset_valuations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  valued_on date not null,
  amount numeric(15,2) not null check (amount >= 0 and amount <= 9999999999999),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (asset_id, user_id) references public.personal_assets(id, user_id) on delete cascade
);
create index personal_asset_valuations_owner_idx on public.personal_asset_valuations(user_id, asset_id, valued_on);

alter table public.personal_assets enable row level security;
alter table public.personal_asset_valuations enable row level security;
create policy personal_assets_read on public.personal_assets for select to authenticated using (user_id = (select auth.uid()));
create policy personal_asset_valuations_read on public.personal_asset_valuations for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.personal_assets, public.personal_asset_valuations from anon, authenticated;
grant select on public.personal_assets, public.personal_asset_valuations to authenticated;

-- Both the asset and its dated valuation commit together. Preserve every revision.
create function public.save_personal_asset(p_id uuid, p_kind text, p_name text, p_note text, p_date date, p_details jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_id uuid := p_id;
  v_amount numeric;
  v_share numeric;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
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
    insert into public.personal_assets(user_id, kind, name, note)
    values(v_user, p_kind, trim(p_name), p_note) returning id into v_id;
  else
    -- Row locking serializes updates and deletion of a holding.
    perform 1 from public.personal_assets where id = p_id and user_id = v_user and deleted_on is null and kind = p_kind for update;
    if not found then raise exception 'Asset unavailable'; end if;
    update public.personal_assets set name = trim(p_name), note = p_note where id = p_id;
  end if;
  insert into public.personal_asset_valuations(asset_id, user_id, valued_on, amount, details)
  values(v_id, v_user, p_date, round(v_amount, 2), p_details);
  return v_id;
end;
$$;

create function public.delete_personal_asset(p_id uuid, p_date date)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_date is null or abs(p_date - (now() at time zone 'Asia/Seoul')::date) > 1 then raise exception 'Invalid deletion date'; end if;
  update public.personal_assets set deleted_on = p_date
    where id = p_id and user_id = auth.uid() and deleted_on is null;
  if not found then raise exception 'Asset unavailable'; end if;
end;
$$;
revoke all on function public.save_personal_asset(uuid,text,text,text,date,jsonb) from public, anon;
revoke all on function public.delete_personal_asset(uuid,date) from public, anon;
grant execute on function public.save_personal_asset(uuid,text,text,text,date,jsonb) to authenticated;
grant execute on function public.delete_personal_asset(uuid,date) to authenticated;
