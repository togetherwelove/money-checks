delete from public.ledger_entry_attachments;
delete from public.ledger_entries;

alter table public.ledger_entries
  add column if not exists category_id text;

alter table public.ledger_entries
  alter column category_id set default '';

alter table public.ledger_entries
  alter column category_id set not null;

create index if not exists ledger_entries_book_category_id_created_at_idx
  on public.ledger_entries (book_id, category_id, created_at desc, id asc);
