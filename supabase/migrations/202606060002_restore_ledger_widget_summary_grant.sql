revoke all on function public.get_ledger_widget_summary(uuid, date, integer) from public, anon;

grant execute on function public.get_ledger_widget_summary(uuid, date, integer) to authenticated;
