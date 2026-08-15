create or replace function private.get_ledger_app_bootstrap(
  date_from date,
  date_to date
)
returns table (
  active_book_id uuid,
  books jsonb,
  entries jsonb
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_active_book_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user is required';
  end if;

  select active_book.id
  into current_active_book_id
  from private.get_active_ledger_book() as active_book
  limit 1;

  return query
  select
    current_active_book_id,
    coalesce(
      (
        select jsonb_agg(to_jsonb(book_state))
        from private.get_accessible_ledger_book_state() as book_state
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(to_jsonb(entry_summary) order by entry_summary.occurred_on, entry_summary.id)
        from private.get_ledger_entry_summaries_with_names(
          current_active_book_id,
          date_from,
          date_to
        ) as entry_summary
      ),
      '[]'::jsonb
    );
end;
$$;

create or replace function public.get_ledger_app_bootstrap(
  date_from date,
  date_to date
)
returns table (
  active_book_id uuid,
  books jsonb,
  entries jsonb
)
language sql
security invoker
set search_path = public, private
as $$
  select *
  from private.get_ledger_app_bootstrap(date_from, date_to);
$$;

revoke all on function public.get_ledger_app_bootstrap(date, date) from public, anon;
revoke all on function private.get_ledger_app_bootstrap(date, date) from public, anon;

grant execute on function public.get_ledger_app_bootstrap(date, date) to authenticated;
grant execute on function private.get_ledger_app_bootstrap(date, date) to authenticated;
