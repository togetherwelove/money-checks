-- Preserve each account, ownership, sharing and valuation history.
-- All cash and savings accounts now use the existing cash movement rules.
alter table public.personal_assets drop constraint personal_assets_kind_check;

update public.personal_assets set kind = 'cash' where kind = 'savings';

alter table public.personal_assets add constraint personal_assets_kind_check
check (kind in ('cash','stock','property','car','other','loan','other-debt'));
