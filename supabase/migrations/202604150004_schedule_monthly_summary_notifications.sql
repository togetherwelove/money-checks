alter table public.notification_preferences
  add column if not exists summary_timezone text;

alter table public.notification_preferences
  add column if not exists last_monthly_summary_sent_month text;

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'send-monthly-summary-notifications-hourly'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'send-monthly-summary-notifications-hourly',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-monthly-summary-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'monthly_summary_cron_secret')
      ),
      body := jsonb_build_object(
        'triggeredAt', timezone('utc', now())
      )
    );
  $$
);
