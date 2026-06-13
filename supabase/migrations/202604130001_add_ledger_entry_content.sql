alter table public.ledger_entries
add column if not exists content text not null default '';
