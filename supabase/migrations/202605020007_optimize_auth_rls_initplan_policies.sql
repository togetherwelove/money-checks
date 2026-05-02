drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check ((select auth.uid()) = id);

drop policy if exists "raw_text_events_own_all" on public.raw_text_events;
create policy "raw_text_events_own_all" on public.raw_text_events
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "classification_results_own_all" on public.classification_results;
create policy "classification_results_own_all" on public.classification_results
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "receipt_files_own_all" on public.receipt_files;
create policy "receipt_files_own_all" on public.receipt_files
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ledger_entries_editor_insert" on public.ledger_entries;
create policy "ledger_entries_editor_insert" on public.ledger_entries
for insert with check (
  public.is_book_editor(book_id)
  and (select auth.uid()) = user_id
);

drop policy if exists "ledger_book_join_requests_select_related" on public.ledger_book_join_requests;
create policy "ledger_book_join_requests_select_related" on public.ledger_book_join_requests
for select using (
  requester_user_id = (select auth.uid())
  or public.is_book_owner(book_id)
);

drop policy if exists "push_device_tokens_select_own" on public.push_device_tokens;
create policy "push_device_tokens_select_own" on public.push_device_tokens
for select using ((select auth.uid()) = user_id);

drop policy if exists "push_device_tokens_insert_own" on public.push_device_tokens;
create policy "push_device_tokens_insert_own" on public.push_device_tokens
for insert with check ((select auth.uid()) = user_id);

drop policy if exists "push_device_tokens_update_own" on public.push_device_tokens;
create policy "push_device_tokens_update_own" on public.push_device_tokens
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "push_device_tokens_delete_own" on public.push_device_tokens;
create policy "push_device_tokens_delete_own" on public.push_device_tokens
for delete using ((select auth.uid()) = user_id);

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own" on public.notification_preferences
for select using ((select auth.uid()) = user_id);

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own" on public.notification_preferences
for insert with check ((select auth.uid()) = user_id);

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own" on public.notification_preferences
for update using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ledger_entry_attachments_own_all" on public.ledger_entry_attachments;
create policy "ledger_entry_attachments_own_all" on public.ledger_entry_attachments
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ledger_day_notes_editor_insert" on public.ledger_day_notes;
create policy "ledger_day_notes_editor_insert" on public.ledger_day_notes
for insert with check (
  public.is_book_editor(book_id)
  and (select auth.uid()) = user_id
);

drop policy if exists "ledger_day_notes_editor_update" on public.ledger_day_notes;
create policy "ledger_day_notes_editor_update" on public.ledger_day_notes
for update using (public.is_book_editor(book_id))
with check (
  public.is_book_editor(book_id)
  and (select auth.uid()) = user_id
);
