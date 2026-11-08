-- Retain individual holdings and all valuations when removing specialized kinds.
alter table public.personal_assets drop constraint personal_assets_kind_check;

update public.personal_assets
set kind = 'other'
where kind in ('investment', 'deposit');

alter table public.personal_assets add constraint personal_assets_kind_check
check (kind in ('cash','savings','stock','property','car','other','loan','other-debt'));
