-- pg_cron uses UTC: 15:00 on the last UTC day starts the next Korean month.
create extension if not exists pg_cron;
select cron.schedule(
  'close-asset-months',
  '0 15 * * *',
  'select private.close_asset_months();'
);
