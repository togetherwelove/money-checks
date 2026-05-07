with clear_settings as (select 'TARGET_USER_ID'::uuid as target_user_id),
target_books as (
  select members.book_id
  from public.ledger_book_members as members
  join clear_settings
    on clear_settings.target_user_id = members.user_id
),
target_entries as (
  select entries.id
  from public.ledger_entries as entries
  where entries.book_id in (select book_id from target_books)
),
target_receipt_files as (
  select distinct receipt_files.id, receipt_files.storage_bucket, receipt_files.storage_path
  from public.receipt_files as receipt_files
  join public.ledger_entry_attachments as attachments
    on attachments.receipt_file_id = receipt_files.id
  where attachments.ledger_entry_id in (select id from target_entries)
    or attachments.installment_group_id in (
      select entries.installment_group_id
      from public.ledger_entries as entries
      where entries.id in (select id from target_entries)
        and entries.installment_group_id is not null
    )
),
deleted_classification_results as (
  delete from public.classification_results as results
  using clear_settings
  where results.user_id = clear_settings.target_user_id
    or results.ledger_entry_id in (select id from target_entries)
  returning results.id
),
deleted_raw_text_events as (
  delete from public.raw_text_events as events
  using clear_settings
  where events.user_id = clear_settings.target_user_id
  returning events.id
),
deleted_day_notes as (
  delete from public.ledger_day_notes as notes
  where notes.book_id in (select book_id from target_books)
  returning notes.id
),
deleted_entries as (
  delete from public.ledger_entries as entries
  where entries.id in (select id from target_entries)
  returning entries.id
),
deleted_receipt_files as (
  delete from public.receipt_files as receipt_files
  where receipt_files.id in (select id from target_receipt_files)
  returning receipt_files.id
)
select
  (select count(*) from target_books) as target_book_count,
  (select count(*) from deleted_entries) as deleted_entry_count,
  (select count(*) from deleted_day_notes) as deleted_day_note_count,
  (select count(*) from deleted_receipt_files) as deleted_receipt_file_count,
  (select count(*) from deleted_raw_text_events) as deleted_raw_text_event_count,
  (select count(*) from deleted_classification_results) as deleted_classification_result_count,
  (
    select jsonb_agg(
      jsonb_build_object(
        'bucket',
        target_receipt_files.storage_bucket,
        'path',
        target_receipt_files.storage_path
      )
      order by target_receipt_files.storage_path
    )
    from target_receipt_files
  ) as storage_objects_to_delete_with_storage_api;
