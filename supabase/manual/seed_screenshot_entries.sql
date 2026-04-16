-- Usage:
-- 1. Replace TARGET_USER_ID with the target auth.users.id UUID.
-- 2. Run this file in Supabase SQL Editor.
-- 3. Re-running is safe. Existing rows from this seed key are deleted first.

with seed_target as (
  select
    'TARGET_USER_ID'::uuid as user_id,
    'screenshot-demo-v1'::text as seed_key
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
          and members.role = 'owner'
        order by members.created_at
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
  target_book.user_id,
  target_book.book_id,
  'manual',
  seed_rows.entry_type,
  seed_rows.occurred_on,
  seed_rows.amount,
  'KRW',
  seed_rows.content,
  seed_rows.category,
  seed_rows.note,
  jsonb_build_object('seed_key', target_book.seed_key, 'seed_name', 'screenshot-demo'),
  seed_rows.created_at,
  seed_rows.created_at
from target_book
cross join lateral (
  values
    (
      'income',
      current_date - 25,
      3200000.00::numeric,
      '월급',
      '급여',
      '4월 급여',
      timezone('utc', now()) - interval '12 days'
    ),
    (
      'expense',
      current_date - 24,
      5800.00::numeric,
      '출근 커피',
      '외식/카페',
      '아이스 아메리카노',
      timezone('utc', now()) - interval '11 days 23 hours'
    ),
    (
      'expense',
      current_date - 23,
      18500.00::numeric,
      '점심 식사',
      '식비',
      '팀 점심',
      timezone('utc', now()) - interval '11 days 22 hours'
    ),
    (
      'expense',
      current_date - 22,
      62000.00::numeric,
      '장보기',
      '쇼핑',
      '생필품 보충',
      timezone('utc', now()) - interval '11 days 20 hours'
    ),
    (
      'expense',
      current_date - 20,
      14500.00::numeric,
      '지하철 충전',
      '교통',
      '교통카드',
      timezone('utc', now()) - interval '10 days 18 hours'
    ),
    (
      'income',
      current_date - 18,
      90000.00::numeric,
      '중고 판매',
      '중고판매',
      '책상 의자 판매',
      timezone('utc', now()) - interval '9 days 21 hours'
    ),
    (
      'expense',
      current_date - 16,
      12900.00::numeric,
      '정기 구독',
      '구독',
      '음악 스트리밍',
      timezone('utc', now()) - interval '8 days 16 hours'
    ),
    (
      'expense',
      current_date - 14,
      43000.00::numeric,
      '병원 진료',
      '의료',
      '감기 진료',
      timezone('utc', now()) - interval '7 days 15 hours'
    ),
    (
      'income',
      current_date - 12,
      35000.00::numeric,
      '환급',
      '환급',
      '카드 캐시백',
      timezone('utc', now()) - interval '6 days 13 hours'
    ),
    (
      'expense',
      current_date - 10,
      78000.00::numeric,
      '주말 데이트',
      '여가',
      '영화 + 저녁',
      timezone('utc', now()) - interval '5 days 10 hours'
    ),
    (
      'expense',
      current_date - 7,
      24000.00::numeric,
      '택시 이용',
      '교통',
      '비 오는 날 귀가',
      timezone('utc', now()) - interval '4 days 8 hours'
    ),
    (
      'expense',
      current_date - 5,
      31500.00::numeric,
      '저녁 장보기',
      '식비',
      '과일, 우유, 샐러드',
      timezone('utc', now()) - interval '3 days 20 hours'
    ),
    (
      'income',
      current_date - 3,
      120000.00::numeric,
      '부수입 정산',
      '부수입',
      '주말 외주 정산',
      timezone('utc', now()) - interval '2 days 18 hours'
    ),
    (
      'expense',
      current_date - 2,
      8900.00::numeric,
      '아침 베이글',
      '외식/카페',
      '출근 전 간단 식사',
      timezone('utc', now()) - interval '1 day 12 hours'
    ),
    (
      'expense',
      current_date - 1,
      54000.00::numeric,
      '생일 선물',
      '경조사',
      '친구 선물 구매',
      timezone('utc', now()) - interval '14 hours'
    )
) as seed_rows(
  entry_type,
  occurred_on,
  amount,
  content,
  category,
  note,
  created_at
)
where target_book.book_id is not null;

select
  count(*) as seeded_entry_count
from public.ledger_entries
where user_id = 'TARGET_USER_ID'::uuid
  and metadata ->> 'seed_key' = 'screenshot-demo-v1';
