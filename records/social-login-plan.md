# Social Login Plan

## 목표
- 이메일 로그인 흐름은 유지한다.
- Google 로그인은 Supabase OAuth 기준으로 통일한다.
- Apple 로그인은 iOS 배포 준비 단계에서 같은 OAuth 기준으로 추가한다.

## 현재 결정
- `@react-native-google-signin/google-signin` 기반 `signInWithIdToken` 구조는 사용하지 않는다.
- 네이티브 Google 로그인은 `supabase.auth.signInWithOAuth(...)`와 `expo-web-browser`를 사용한다.
- 웹도 같은 Google OAuth provider를 사용한다.
- 앱 딥링크는 `moneychecks://auth/callback` 기준으로 맞춘다.

## 이유
- iOS에서 Google native SDK + `signInWithIdToken` 조합은 URL scheme, audience, nonce 검증까지 맞춰야 해서 유지 비용이 크다.
- Supabase OAuth 경로는 provider 설정과 redirect allow-list만 맞으면 플랫폼별 동작이 단순하다.
- 현재 앱은 Expo development build와 EAS Build를 같이 쓰므로, 브라우저 세션 기반 OAuth가 가장 일관적이다.

## 현재 구현 상태
- 로그인 화면에 Google 로그인 버튼 표시
- 네이티브
  - `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } })`
  - `WebBrowser.openAuthSessionAsync(...)`
  - 리다이렉트 URL에서 `access_token`, `refresh_token` 추출 후 `supabase.auth.setSession(...)`
- 웹
  - `supabase.auth.signInWithOAuth({ provider: "google" })`
- 앱 scheme
  - `moneychecks`

## 환경변수
- 현재 구조에서 필요한 값
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- 현재 구조에서 불필요한 값
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

## 변경된 파일
- `C:/git/money-checks/src/lib/auth/googleSignIn.native.ts`
- `C:/git/money-checks/src/lib/auth/googleSignIn.web.ts`
- `C:/git/money-checks/src/lib/auth/googleAuthSession.ts`
- `C:/git/money-checks/src/constants/authRedirect.ts`
- `C:/git/money-checks/src/constants/googleAuth.ts`
- `C:/git/money-checks/app.config.ts`

## 외부 설정 체크리스트
### Supabase
- Authentication > Providers > Google 활성화
- Google client ID 목록 입력
- Google client secret 입력
- Redirect URL allow-list에 아래 값 추가
  - `moneychecks://auth/callback`
  - 필요하면 `moneychecks://**`

### Google Cloud
- Google provider용 OAuth client 생성
- Supabase Dashboard에 web client ID / secret 반영
- iOS native SDK용 client ID는 현재 구조에서 필요 없다

## 실행 체크리스트
1. 의존성 설치
2. Expo 서버 재시작
3. iOS development build 재설치
4. 로그인 화면에서 Google 로그인 실행
5. 브라우저 인증 후 앱 복귀 확인
6. Supabase 세션 생성 확인

## 주의사항
- 이 구조는 Expo Go가 아니라 development build 기준으로 검증한다.
- 네이티브 설정 변경이 포함되면 JS 새로고침이 아니라 EAS iOS build 재설치가 필요할 수 있다.
