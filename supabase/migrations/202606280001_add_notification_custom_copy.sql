alter table public.notification_preferences
add column if not exists custom_notification_copy jsonb not null default '{}'::jsonb;
