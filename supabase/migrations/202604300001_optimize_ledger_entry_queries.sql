create extension if not exists pg_trgm;

create index if not exists ledger_entries_book_occurred_on_idx
on public.ledger_entries (book_id, occurred_on);

create index if not exists ledger_entries_book_created_at_id_desc_idx
on public.ledger_entries (book_id, created_at desc, id desc);

create index if not exists ledger_entries_book_category_created_at_id_desc_idx
on public.ledger_entries (book_id, category, created_at desc, id desc);

create index if not exists ledger_entries_content_trgm_idx
on public.ledger_entries using gin (content gin_trgm_ops);

create index if not exists ledger_entries_note_trgm_idx
on public.ledger_entries using gin (note gin_trgm_ops);
