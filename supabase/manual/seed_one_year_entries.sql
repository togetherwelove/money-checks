-- Usage:
-- 1. Replace TARGET_USER_ID with the target auth.users.id UUID.
-- 2. Run this file in Supabase SQL Editor.
-- 3. Re-running is safe. Existing rows from this seed key are deleted first.

with seed_target as (
  select
    'TARGET_USER_ID'::uuid as user_id,
    'one-year-demo-v1'::text as seed_key
),
target_book as (
  select
    seed_target.user_id,
    seed_target.seed_key,
    coalesce(
      profiles.active_book_id,
      (
        select members.book_id
        from public.ledger_book_members as members
        where members.user_id = seed_target.user_id
        order by
          case when members.role = 'owner' then 0 else 1 end,
          members.created_at
        limit 1
      )
    ) as book_id
  from seed_target
  join public.profiles as profiles
    on profiles.id = seed_target.user_id
),
deleted_entries as (
  delete from public.ledger_entries as entries
  using target_book
  where entries.user_id = target_book.user_id
    and entries.book_id = target_book.book_id
    and entries.metadata ->> 'seed_key' = target_book.seed_key
  returning entries.id
),
month_series as (
  select
    target_book.user_id,
    target_book.book_id,
    target_book.seed_key,
    month_offset,
    (date_trunc('month', current_date)::date - make_interval(months => month_offset))::date as month_start
  from target_book
  cross join generate_series(0, 11) as month_offset
),
seed_rows as (
  select
    month_series.user_id,
    month_series.book_id,
    month_series.seed_key,
    template.entry_type,
    (month_series.month_start + template.day_offset) as occurred_on,
    template.amount,
    template.content,
    template.category,
    template.note,
    timezone(
      'utc',
      ((month_series.month_start + template.day_offset)::timestamp + template.created_time)
    ) as created_at
  from month_series
  cross join lateral (
    values
      (
        'income'::text,
        0,
        3200000.00::numeric,
        '월급',
        '급여',
        '정기 급여',
        time '09:10'
      ),
      (
        'expense'::text,
        1,
        (6200 + month_series.month_offset * 120)::numeric,
        '출근 커피',
        '식비',
        '평일 아메리카노',
        time '08:40'
      ),
      (
        'expense'::text,
        3,
        (18500 + month_series.month_offset * 350)::numeric,
        '장보기',
        '생활비',
        '채소와 과일',
        time '19:10'
      ),
      (
        'expense'::text,
        6,
        (15000 + month_series.month_offset * 200)::numeric,
        '교통카드 충전',
        '교통',
        '정기 충전',
        time '07:55'
      ),
      (
        'expense'::text,
        9,
        (12900 + month_series.month_offset * 100)::numeric,
        '음원 구독',
        '구독',
        '월간 자동 결제',
        time '00:30'
      ),
      (
        'expense'::text,
        12,
        (43000 + month_series.month_offset * 800)::numeric,
        '마트 장보기',
        '생활비',
        '생필품 보충',
        time '18:45'
      ),
      (
        'income'::text,
        15,
        (70000 + month_series.month_offset * 5000)::numeric,
        '중고 판매',
        '부수입',
        '생활용품 정리',
        time '21:00'
      ),
      (
        'expense'::text,
        18,
        (24000 + month_series.month_offset * 300)::numeric,
        '택시',
        '교통',
        '늦은 귀가',
        time '23:10'
      ),
      (
        'expense'::text,
        21,
        (56000 + month_series.month_offset * 700)::numeric,
        '병원 진료',
        '의료',
        '정기 진료',
        time '14:20'
      ),
      (
        'expense'::text,
        24,
        (78000 + month_series.month_offset * 900)::numeric,
        '주말 외식',
        '식비',
        '둘이 식사',
        time '19:40'
      ),
      (
        'income'::text,
        26,
        (35000 + month_series.month_offset * 1200)::numeric,
        '캐시백',
        '환급',
        '카드 사용 혜택',
        time '10:30'
      ),
      (
        'expense'::text,
        27,
        (9800 + month_series.month_offset * 150)::numeric,
        '베이커리',
        '식비',
        '간식 구입',
        time '16:25'
      )
  ) as template(
    entry_type,
    day_offset,
    amount,
    content,
    category,
    note,
    created_time
  )
  where month_series.book_id is not null
    and extract(
      month
      from (month_series.month_start + template.day_offset)
    ) = extract(month from month_series.month_start)
)
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
  seed_rows.occurred_on,
  seed_rows.amount,
  'KRW',
  seed_rows.content,
  seed_rows.category,
  seed_rows.note,
  jsonb_build_object('seed_key', seed_rows.seed_key, 'seed_name', 'one-year-demo'),
  seed_rows.created_at,
  seed_rows.created_at
from seed_rows;

select
  count(*) as seeded_entry_count
from public.ledger_entries
where user_id = 'TARGET_USER_ID'::uuid
  and metadata ->> 'seed_key' = 'one-year-demo-v1';
