with seed_settings as (select date '2026-05-01' as target_date, 'TARGET_USER_ID'::uuid as target_user_id),
seed_identity as (
  select
    'monthly-random-demo-v1'::text as seed_key,
    'monthly-random-demo'::text as seed_name
),
target_month as (
  select
    date_trunc('month', seed_settings.target_date)::date as month_start,
    (date_trunc('month', seed_settings.target_date) + interval '1 month - 1 day')::date as month_end,
    seed_identity.seed_key,
    seed_identity.seed_name,
    seed_settings.target_user_id as user_id
  from seed_settings
  cross join seed_identity
),
target_book as (
  select
    target_month.month_start,
    target_month.month_end,
    target_month.seed_key,
    target_month.seed_name,
    target_month.user_id,
    coalesce(
      (
        select members.book_id
        from public.ledger_book_members as members
        where members.user_id = target_month.user_id
          and members.book_id = profiles.active_book_id
        limit 1
      ),
      (
        select members.book_id
        from public.ledger_book_members as members
        where members.user_id = target_month.user_id
        order by
          case when members.role = 'owner' then 0 else 1 end,
          members.created_at
        limit 1
      )
    ) as book_id
  from target_month
  join public.profiles as profiles
    on profiles.id = target_month.user_id
),
deleted_entries as (
  delete from public.ledger_entries as entries
  using target_book
  where entries.user_id = target_book.user_id
    and entries.book_id = target_book.book_id
    and entries.occurred_on between target_book.month_start and target_book.month_end
  returning entries.id
),
month_days as (
  select
    target_book.book_id,
    target_book.month_start,
    target_book.month_end,
    target_book.seed_key,
    target_book.seed_name,
    target_book.user_id,
    day_value::date as occurred_on
  from target_book
  cross join generate_series(
    target_book.month_start,
    target_book.month_end,
    interval '1 day'
  ) as day_value
  where target_book.book_id is not null
),
fixed_rows as (
  select
    month_days.user_id,
    month_days.book_id,
    month_days.seed_key,
    month_days.seed_name,
    template.entry_type,
    month_days.month_start + (template.day_offset * interval '1 day') as occurred_on,
    template.amount,
    template.content,
    template.category,
    template.category_id,
    template.note,
    template.created_hour
  from month_days
  cross join lateral (
    values
      ('income', 0, 3200000::numeric, '월급', '급여', 'income-salary', '정기 급여', 9),
      ('expense', 2, 850000::numeric, '월세', '생활', 'expense-housing', '주거비', 10),
      ('expense', 6, 12900::numeric, '음악 구독', '구독', 'expense-subscription', '정기 결제', 8),
      ('expense', 9, 96000::numeric, '공과금', '공과금', 'expense-utilities', '전기/가스/수도', 11),
      ('income', 14, 120000::numeric, '부수입', '부수입', 'income-side', '월중 정산', 18),
      ('expense', 20, 43000::numeric, '병원 진료', '의료', 'expense-medical', '정기 진료', 15)
  ) as template(
    entry_type,
    day_offset,
    amount,
    content,
    category,
    category_id,
    note,
    created_hour
  )
  where month_days.occurred_on = month_days.month_start
),
weekday_rows as (
  select
    month_days.user_id,
    month_days.book_id,
    month_days.seed_key,
    month_days.seed_name,
    template.entry_type,
    month_days.occurred_on,
    template.amount,
    template.content,
    template.category,
    template.category_id,
    template.note,
    template.created_hour
  from month_days
  cross join lateral (
    values
      (
        'expense',
        round((4200 + random() * 2800) / 100) * 100,
        '출근 커피',
        '외식',
        'expense-dining',
        '아침 카페',
        8,
        0.55
      ),
      (
        'expense',
        round((9000 + random() * 9000) / 100) * 100,
        '점심 식사',
        '식비',
        'expense-food',
        '평일 점심',
        12,
        0.72
      ),
      (
        'expense',
        round((1450 + random() * 3550) / 100) * 100,
        '대중교통',
        '교통',
        'expense-transport',
        '이동 비용',
        19,
        0.42
      )
  ) as template(
    entry_type,
    amount,
    content,
    category,
    category_id,
    note,
    created_hour,
    probability
  )
  where extract(isodow from month_days.occurred_on) between 1 and 5
    and random() < template.probability
),
weekly_rows as (
  select
    month_days.user_id,
    month_days.book_id,
    month_days.seed_key,
    month_days.seed_name,
    template.entry_type,
    month_days.occurred_on,
    template.amount,
    template.content,
    template.category,
    template.category_id,
    template.note,
    template.created_hour
  from month_days
  cross join lateral (
    values
      (
        'expense',
        round((38000 + random() * 58000) / 1000) * 1000,
        '장보기',
        '식비',
        'expense-food',
        '주간 장보기',
        17
      ),
      (
        'expense',
        round((25000 + random() * 75000) / 1000) * 1000,
        '생활용품',
        '쇼핑',
        'expense-shopping',
        '소모품 보충',
        16
      )
  ) as template(
    entry_type,
    amount,
    content,
    category,
    category_id,
    note,
    created_hour
  )
  where extract(day from month_days.occurred_on) in (5, 12, 19, 26)
    and random() < 0.78
),
weekend_rows as (
  select
    month_days.user_id,
    month_days.book_id,
    month_days.seed_key,
    month_days.seed_name,
    'expense'::text as entry_type,
    month_days.occurred_on,
    round((22000 + random() * 78000) / 1000) * 1000 as amount,
    template.content,
    template.category,
    template.category_id,
    '주말 지출'::text as note,
    18 as created_hour
  from month_days
  cross join lateral (
    select
      case when random() < 0.55 then '외식' else '문화생활' end as content
  ) as random_choice
  cross join lateral (
    select
      case
        when random_choice.content = '외식' then '외식'
        else '여가'
      end as category,
      case
        when random_choice.content = '외식' then 'expense-dining'
        else 'expense-leisure'
      end as category_id,
      random_choice.content
  ) as template
  where extract(isodow from month_days.occurred_on) in (6, 7)
    and random() < 0.62
),
seed_rows as (
  select * from fixed_rows
  union all
  select * from weekday_rows
  union all
  select * from weekly_rows
  union all
  select * from weekend_rows
),
inserted_entries as (
  insert into public.ledger_entries (
    user_id,
    book_id,
    source_type,
    entry_type,
    occurred_on,
    amount,
    currency,
    content,
    category,
    category_id,
    note,
    metadata,
    created_at,
    updated_at
  )
  select
    seed_rows.user_id,
    seed_rows.book_id,
    'manual',
    seed_rows.entry_type,
    seed_rows.occurred_on::date,
    seed_rows.amount,
    'KRW',
    seed_rows.content,
    seed_rows.category,
    seed_rows.category_id,
    seed_rows.note,
    jsonb_build_object(
      'seed_key',
      seed_rows.seed_key,
      'seed_name',
      seed_rows.seed_name,
      'seed_month',
      to_char(seed_rows.occurred_on::date, 'YYYY-MM')
    ),
    timezone(
      'utc',
      seed_rows.occurred_on::timestamp
        + make_interval(
            hours => seed_rows.created_hour,
            mins => floor(random() * 60)::integer
          )
    ),
    timezone(
      'utc',
      seed_rows.occurred_on::timestamp
        + make_interval(
            hours => seed_rows.created_hour,
            mins => floor(random() * 60)::integer
          )
    )
  from seed_rows
  returning id, book_id, occurred_on
)

select
  count(*) as seeded_entry_count,
  min(occurred_on) as first_seeded_date,
  max(occurred_on) as last_seeded_date,
  array_agg(distinct book_id) as seeded_book_ids
from inserted_entries;
