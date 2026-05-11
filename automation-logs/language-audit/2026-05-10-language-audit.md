# 앱 언어 기능 점검

- 실행 시각: 2026-05-10 15:59:45 +09:00
- 자동화 ID: automation
- 이전 메모리: 없음

## 점검 범위

- 앱 i18n 리소스: `src/i18n/resources/ko.ts`, `src/i18n/resources/en.ts`
- 정적 언어 카피: `src/constants`, `src/lib`, `src/notifications`, `src/utils` 내 `ko/en` 카피 객체
- Edge Function 알림 리소스: `supabase/functions/_shared/i18n/resources.ts`
- 언어 전환 UI: `src/components/accountScreen/AccountLanguageCard.tsx`

## 발견 및 수정

1. 공유 가계부 멤버 제거 액션 표기가 실제 동작과 맞지 않았습니다.
   - 영어: `Release` -> `Remove`
   - 영어 확인 제목: `Release this member?` -> `Remove this member?`
   - 한국어: `강퇴` -> `내보내기`
   - 한국어 확인 제목: `멤버를 강퇴할까요?` -> `멤버를 내보낼까요?`
   - 한국어 오류 문구: `멤버를 강퇴하지 못했어요.` -> `멤버를 내보내지 못했어요.`

2. 공유 가계부 권한 `Viewer`의 한국어 표기가 역할명으로 어색했습니다.
   - `보기` -> `조회자`

3. 언어 전환 재시작 안내의 한국어 띄어쓰기를 수정했습니다.
   - `앱을 재시작해주세요.` -> `앱을 재시작해 주세요.`

## 검증 결과

- `ko/en` 언어 객체 65개 정적 검사: 누락 없음
- 앱/함수 i18n 리소스의 치환 변수 불일치: 없음
- 앱/함수 i18n 리소스의 언어별 키 구조 불일치: 없음
- 언어 전환 UI: 한국어/영어 버튼은 2분할 flex 행으로 구성되어 있고, 현재 라벨 길이에서는 레이아웃 걸림 위험이 낮음
- 정적 카피는 `selectStaticCopy`가 모듈 로드 시점에 결정되므로 앱 전체 문구는 기존 안내처럼 재시작 후 완전히 반영되는 구조임

## 검증 제한

- `pnpm exec tsc --noEmit`: 샌드박스가 `C:\Users\chanwook` 경로 `lstat`을 EPERM으로 차단해 실패
- `.\node_modules\.bin\tsc.cmd --noEmit`: 샌드박스가 `node_modules\typescript\bin\tsc` 읽기를 EPERM으로 차단해 실패
- `.\node_modules\.bin\biome.cmd check ...`: 샌드박스가 Biome 실행 파일 spawn을 EPERM으로 차단해 실패
- TypeScript API 기반 진단은 Expo 확장 tsconfig와 lib 해석이 정상 재현되지 않아 검증 근거에서 제외
