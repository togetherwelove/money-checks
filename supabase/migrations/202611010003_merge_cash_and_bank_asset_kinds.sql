-- Consolidate the category without combining individual holdings or their history.
alter table public.personal_assets drop constraint personal_assets_kind_check;

update public.personal_assets
set kind = 'cash'
where kind = 'bank';

alter table public.personal_assets add constraint personal_assets_kind_check
check (kind in ('cash','savings','stock','investment','property','deposit','car','other','loan','other-debt'));
