alter table public.notification_preferences
add column if not exists enabled_thresholds jsonb not null default '{}'::jsonb;
