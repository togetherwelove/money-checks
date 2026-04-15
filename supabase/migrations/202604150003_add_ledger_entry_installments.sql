alter table public.ledger_entries
add column if not exists installment_group_id text,
add column if not exists installment_months integer,
add column if not exists installment_order integer;

create index if not exists ledger_entries_installment_group_id_idx
on public.ledger_entries (installment_group_id);
