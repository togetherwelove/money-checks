-- Keep existing holdings and their valuation history under the generic debt kind.
alter table public.personal_assets drop constraint personal_assets_kind_check;

update public.personal_assets
set kind = 'other-debt'
where kind in ('installment', 'deposit-debt');

alter table public.personal_assets add constraint personal_assets_kind_check
check (kind in ('cash','bank','savings','stock','investment','property','deposit','car','other','loan','other-debt'));
