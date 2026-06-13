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

update public.notification_preferences
set enabled_by_event = enabled_by_event - 'month_end_summary'
where enabled_by_event ? 'month_end_summary';
