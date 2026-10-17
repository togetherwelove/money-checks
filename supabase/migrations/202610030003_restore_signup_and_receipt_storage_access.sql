-- Restore objects missing from databases previously updated through SQL Editor.
-- Use the latest existing bootstrap and storage access functions.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "receipt_files_bucket_select_own" on storage.objects;
create policy "receipt_files_bucket_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'receipt-files'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "receipt_files_bucket_insert_own" on storage.objects;
create policy "receipt_files_bucket_insert_own" on storage.objects
for insert to authenticated
with check (
  private.can_upload_receipt_file_storage_object(bucket_id, name)
);

drop policy if exists "receipt_files_bucket_delete_own" on storage.objects;
create policy "receipt_files_bucket_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'receipt-files'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "receipt_files_bucket_select_book_member" on storage.objects;
create policy "receipt_files_bucket_select_book_member" on storage.objects
for select to authenticated
using (
  bucket_id = 'receipt-files'
  and private.can_access_receipt_file_storage_object(bucket_id, name)
);
