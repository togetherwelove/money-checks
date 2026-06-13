create or replace function public.get_ledger_widget_summary(
  p_book_id uuid,
  p_today date,
  p_recent_limit integer default 2
)
returns table (
  month_income_amount numeric,
  month_expense_amount numeric,
  today_income_amount numeric,
  today_expense_amount numeric,
  recent_entries jsonb
)
language sql
stable
as $$
  with month_bounds as (
    select
      date_trunc('month', p_today)::date as month_start,
      (date_trunc('month', p_today)::date + interval '1 month' - interval '1 day')::date
        as month_end
  ),
  month_entries as (
    select
      entries.id,
      entries.entry_type,
      entries.occurred_on,
      entries.amount,
      entries.content
    from public.ledger_entries as entries
    cross join month_bounds
    where entries.book_id = p_book_id
      and entries.occurred_on >= month_bounds.month_start
      and entries.occurred_on <= month_bounds.month_end
  ),
  recent_month_entries as (
    select
      month_entries.id,
      month_entries.amount,
      month_entries.content,
      month_entries.entry_type,
      month_entries.occurred_on
    from month_entries
    order by month_entries.occurred_on desc, month_entries.id desc
    limit greatest(p_recent_limit, 0)
  )
  select
    coalesce(sum(month_entries.amount) filter (where month_entries.entry_type = 'income'), 0),
    coalesce(sum(month_entries.amount) filter (where month_entries.entry_type = 'expense'), 0),
    coalesce(sum(month_entries.amount) filter (
      where month_entries.entry_type = 'income'
        and month_entries.occurred_on = p_today
    ), 0),
    coalesce(sum(month_entries.amount) filter (
      where month_entries.entry_type = 'expense'
        and month_entries.occurred_on = p_today
    ), 0),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'amount', recent_month_entries.amount,
            'content', recent_month_entries.content,
            'date', recent_month_entries.occurred_on,
            'type', recent_month_entries.entry_type
          )
          order by recent_month_entries.occurred_on desc, recent_month_entries.id desc
        )
        from recent_month_entries
      ),
      '[]'::jsonb
    )
  from month_entries;
$$;

grant execute on function public.get_ledger_widget_summary(uuid, date, integer) to authenticated;
