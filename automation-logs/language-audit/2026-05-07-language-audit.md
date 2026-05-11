# 앱 언어 기능 점검

- 실행 시각: 2026-05-07 23:31:34 +09:00
- 자동화 ID: automation

## 점검 범위

- 앱 i18n 리소스: `src/i18n/resources/ko.ts`, `src/i18n/resources/en.ts`
- 하단 탭 라벨 매핑: `src/lib/footerTabs.ts`
- 정적 카테고리 표기: `src/constants/incomeCategories.ts`
- Edge Function 알림 리소스: `supabase/functions/_shared/i18n/resources.ts`

## 발견 및 수정

1. 수입 카테고리 `bonus`의 한국어 표기가 리소스별로 달랐습니다.
   - `성과금` -> `성과급`

2. 하단 탭 표기는 사용자 확인에 따라 `내보내기/Export`가 맞는 표기로 정정했습니다.
   - 한국어: `내보내기`
   - 영어: `Export`
   - 키 이름: `footer.tabs.export`

## 검증 결과

- 앱 한국어/영어 리소스 키 누락: 없음
- Edge Function 한국어/영어 리소스 키 누락: 없음
- `{{actorName}}`, `{{category}}` 등 치환 변수 언어별 불일치: 없음
- UTF-8 한국어 표기 깨짐 의심 패턴: 없음
- UI 걸림 가능성: 하단 탭은 아이콘 중심이며 변경된 라벨은 접근성 라벨이라 레이아웃 영향 없음. 카테고리 셀은 `numberOfLines={2}`와 `adjustsFontSizeToFit`가 적용되어 현재 수정(`성과급`)에 따른 레이아웃 위험 없음.

## 정정 기록

- 2026-05-07 23:34:15 +09:00: 사용자 확인에 따라 하단 탭을 `공유/Sharing`에서 `내보내기/Export`로 정정했습니다.
- 재검증: 앱 한국어/영어 리소스 키 누락 없음, 치환 변수 불일치 없음.

## 검증 제한

- `pnpm exec tsc --noEmit` 및 로컬 `tsc.cmd` 실행은 샌드박스 EPERM으로 실패했습니다. 대신 파일 기반 i18n 구조/치환 변수 정적 검증을 수행했습니다.
