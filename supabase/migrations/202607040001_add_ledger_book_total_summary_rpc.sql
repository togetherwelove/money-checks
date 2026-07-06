create or replace function public.get_ledger_book_total_summary(p_book_id uuid)
returns table (
  total_income_amount numeric,
  total_expense_amount numeric
)
language sql
stable
set search_path = public
as $$
  select
    coalesce(sum(entries.amount) filter (where entries.entry_type = 'income'), 0),
    coalesce(sum(entries.amount) filter (where entries.entry_type = 'expense'), 0)
  from public.ledger_entries as entries
  where entries.book_id = p_book_id;
$$;

revoke all on function public.get_ledger_book_total_summary(uuid) from public, anon;
grant execute on function public.get_ledger_book_total_summary(uuid) to authenticated;
