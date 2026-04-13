# Social Login Plan

## 목표
- 현재 이메일 로그인 유지
- Google 로그인 먼저 도입
- Apple 로그인은 iOS 배포 준비 단계에서 추가
- Supabase 세션은 `signInWithIdToken`으로 통일

## 현재 판단
- 현재 프로젝트는 Expo SDK 54 기반이다.
- 소셜 로그인은 `Expo Go`보다 `development build` 기준으로 준비하는 것이 맞다.
- Windows 환경에서는 Google 로그인 구현과 Android 검증을 먼저 진행하고, iOS는 EAS Build와 실기기로 확인한다.

## 권장 라이브러리
- Google: `@react-native-google-signin/google-signin`
- Apple: `expo-apple-authentication`

## Supabase 연동 방식
- Google 로그인 성공 후 `idToken`을 Supabase에 전달한다.
- Apple 로그인 성공 후 `identityToken`을 Supabase에 전달한다.
- 공통 세션화 경로:
  - `supabase.auth.signInWithIdToken({ provider: "google", token })`
  - `supabase.auth.signInWithIdToken({ provider: "apple", token })`

## 구현 순서
1. 현재 이메일 로그인 유지
2. `development build` 전환 준비
3. Google 로그인 버튼과 인증 모듈 추가
4. Android에서 Google 로그인 검증
5. EAS Build로 iOS development build 검증
6. Apple 로그인 추가
7. App Store 배포 전 Apple 심사 요건 확인

## Google 도입 체크리스트
- 패키지 설치
  - `@react-native-google-signin/google-signin`
- 환경 변수 추가
  - Android client id
  - iOS client id
  - Web client id 또는 server client id
- Google Cloud Console 설정
  - Android 앱 등록
  - iOS 앱 등록
  - 필요 시 SHA fingerprint 등록
- Supabase Dashboard
  - Google provider 활성화
- 앱 코드
  - 로그인 버튼 추가
  - Google 로그인 성공 후 `idToken` 추출
  - Supabase `signInWithIdToken` 호출

## Apple 도입 체크리스트
- Apple Developer Program 준비
- 패키지 설치
  - `expo-apple-authentication`
- Apple Developer 설정
  - App ID
  - Sign in with Apple 활성화
  - 필요 시 Service ID / Key / Team ID
- Supabase Dashboard
  - Apple provider 활성화
- 앱 코드
  - iOS에서만 버튼 노출
  - `identityToken` 추출
  - Supabase `signInWithIdToken` 호출

## 현재 프로젝트에서 바뀔 파일 후보
- `C:/git/money-checks/src/screens/AuthScreen.tsx`
- `C:/git/money-checks/src/components/authScreen/*`
- `C:/git/money-checks/src/lib/auth/*`
- `C:/git/money-checks/src/lib/supabase.ts`
- `C:/git/money-checks/app.json`
- `C:/git/money-checks/package.json`

## Windows 기준 운영 방식
- 구현: Windows에서 진행
- Android 검증: 로컬
- iOS 검증: EAS Build + 실기기
- 로컬 Xcode 디버깅은 포기하고, iOS 네이티브 이슈는 빌드 로그와 실기기 테스트로 확인

## 우선순위
- 1순위: Google 로그인
- 2순위: iOS development build 확인
- 3순위: Apple 로그인

## 비고
- Google 같은 서드파티 로그인을 App Store 제출 버전에 포함하면 Apple 로그인도 같이 준비하는 편이 안전하다.
- 실제 도입 턴에서는 먼저 Google만 붙이고, Apple은 별도 작업으로 분리한다.
