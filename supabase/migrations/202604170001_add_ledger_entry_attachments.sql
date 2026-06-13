create table if not exists public.ledger_entry_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ledger_entry_id uuid references public.ledger_entries(id) on delete cascade,
  installment_group_id text,
  receipt_file_id uuid not null references public.receipt_files(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint ledger_entry_attachments_target_check
    check ((ledger_entry_id is not null) <> (installment_group_id is not null))
);

create index if not exists ledger_entry_attachments_user_id_idx
  on public.ledger_entry_attachments (user_id);

create index if not exists ledger_entry_attachments_entry_id_idx
  on public.ledger_entry_attachments (ledger_entry_id);

create index if not exists ledger_entry_attachments_installment_group_id_idx
  on public.ledger_entry_attachments (installment_group_id);

create unique index if not exists ledger_entry_attachments_entry_receipt_file_unique
  on public.ledger_entry_attachments (ledger_entry_id, receipt_file_id)
  where ledger_entry_id is not null;

create unique index if not exists ledger_entry_attachments_group_receipt_file_unique
  on public.ledger_entry_attachments (installment_group_id, receipt_file_id)
  where installment_group_id is not null;

alter table public.ledger_entry_attachments enable row level security;

create policy "ledger_entry_attachments_own_all" on public.ledger_entry_attachments
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipt-files',
  'receipt-files',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy "receipt_files_bucket_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'receipt-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "receipt_files_bucket_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'receipt-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "receipt_files_bucket_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'receipt-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);
