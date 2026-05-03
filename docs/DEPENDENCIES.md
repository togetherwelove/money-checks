# 의존성 목적 정리

이 문서는 `package.json`에 들어 있는 의존성이 앱에서 왜 필요한지 빠르게 확인하기 위한 문서입니다. 기준은 Expo SDK 55와 현재 모바일 앱 구조입니다.

## 기본 런타임

| 패키지 | 필요한 이유 |
| --- | --- |
| `expo` | Expo SDK, config plugin, 개발 서버, EAS 빌드의 기본 런타임입니다. |
| `react` | React Native 화면을 구성하는 React 런타임입니다. |
| `react-native` | iOS/Android 앱의 네이티브 UI와 브리지 런타임입니다. |
| `@expo/metro-runtime` | Expo Metro 번들 런타임입니다. |
| `expo-constants` | 앱 버전, 실행 환경, Expo config 값을 런타임에서 읽기 위해 사용합니다. |
| `expo-dev-client` | Expo Go 대신 커스텀 개발 빌드로 네이티브 모듈을 테스트하기 위해 필요합니다. |

## 화면과 내비게이션

| 패키지 | 필요한 이유 |
| --- | --- |
| `@react-navigation/native` | 앱의 내비게이션 상태와 컨테이너를 관리합니다. |
| `@react-navigation/native-stack` | iOS/Android 네이티브 스택 기반 화면 전환에 사용합니다. |
| `react-native-screens` | native-stack이 사용하는 네이티브 screen primitive입니다. |
| `react-native-safe-area-context` | 노치, 상태바, 홈 인디케이터 안전 영역을 처리합니다. |
| `react-native-gesture-handler` | 네이티브 제스처 처리와 내비게이션 제스처에 필요합니다. |
| `react-native-reanimated` | 화면 전환, 제스처, 애니메이션 기반 기능에 사용합니다. |
| `react-native-worklets` | Reanimated 4와 New Architecture 환경의 worklet 런타임입니다. |
| `react-native-keyboard-aware-scroll-view` | 입력 화면에서 키보드가 입력창을 가리지 않도록 스크롤을 보정합니다. |
| `react-native-pager-view` | 월 캘린더와 차트의 스와이프 페이지 전환에 사용합니다. |

## 인증과 보안 저장소

| 패키지 | 필요한 이유 |
| --- | --- |
| `@supabase/supabase-js` | Supabase Auth, Database, Edge Function 호출에 사용합니다. |
| `expo-apple-authentication` | iOS Sign in with Apple에 필요합니다. |
| `expo-auth-session` | Google OAuth 등 외부 인증 세션 처리에 사용합니다. |
| `expo-crypto` | 인증과 보안 흐름에서 난수, 해시 등이 필요할 때 사용합니다. |
| `expo-secure-store` | 민감한 로컬 값을 OS 보안 저장소에 저장합니다. |
| `react-native-url-polyfill` | Supabase 등 URL API를 기대하는 라이브러리 호환성을 위해 필요합니다. |

## 알림과 백그라운드

| 패키지 | 필요한 이유 |
| --- | --- |
| `expo-notifications` | 푸시 알림, 알림 권한, 알림 액션 카테고리에 사용합니다. |
| `expo-task-manager` | 백그라운드 알림이나 비동기 작업 등록에 사용합니다. |
| `expo-device` | 푸시 토큰 등록 시 실제 기기 여부와 기기 정보를 확인합니다. |

## 데이터, 파일, 공유

| 패키지 | 필요한 이유 |
| --- | --- |
| `expo-sqlite` | 앱 내부 로컬 저장소와 캐시에 사용합니다. |
| `expo-file-system` | 첨부 이미지, 리포트, 임시 파일 처리에 사용합니다. |
| `expo-sharing` | 생성한 파일을 OS 공유 시트로 내보낼 때 사용합니다. |
| `expo-mail-composer` | 문의 메일 작성 화면을 여는 데 사용합니다. |
| `expo-clipboard` | 클립보드 읽기와 복사 기능에 사용합니다. |
| `xlsx` | 가계부 내역과 연간 리포트를 스프레드시트 파일로 만들 때 사용합니다. |

## 미디어와 UI 표현

| 패키지 | 필요한 이유 |
| --- | --- |
| `@expo/vector-icons` | 버튼, 메뉴, 분류 아이콘 표시에 사용합니다. |
| `expo-font` | 아이콘 폰트와 앱 폰트 로딩에 필요합니다. |
| `react-native-svg` | 차트와 SVG 기반 그래픽 표현에 사용합니다. |
| `expo-linear-gradient` | 구독 화면 등 일부 UI의 그라데이션 표현에 사용합니다. |
| `expo-image-picker` | 이미지 첨부 기능에서 사진 선택과 촬영 권한 처리를 제공합니다. |
| `@react-native-community/datetimepicker` | 네이티브 날짜 선택 UI에 사용합니다. |
| `@react-native-picker/picker` | 선택형 입력 UI에 사용합니다. |
| `react-native-markdown-display` | 앱 내부 Markdown 안내 화면 렌더링에 사용합니다. |

## 수익화

| 패키지 | 필요한 이유 |
| --- | --- |
| `react-native-google-mobile-ads` | 무료 플랜 광고 배너, 전면 광고, 네이티브 광고 표시에 사용합니다. |
| `react-native-purchases` | RevenueCat 구독 상태, 구매, 복원 흐름에 사용합니다. |

## 오버레이와 피드백

| 패키지 | 필요한 이유 |
| --- | --- |
| `react-native-root-siblings` | 앱 루트 바깥에 toast와 overlay를 띄우기 위한 기반입니다. |
| `react-native-root-toast` | 사용자 피드백용 toast 메시지 표시에 사용합니다. |

## 개발과 검증

| 패키지 | 필요한 이유 |
| --- | --- |
| `babel-preset-expo` | Expo 프로젝트의 Babel 변환 preset입니다. |
| `typescript` | 정적 타입 검사에 사용합니다. |
| `@types/react` | TypeScript에서 React 타입 검사를 하기 위해 필요합니다. |
| `@biomejs/biome` | 포맷과 정적 검사에 사용합니다. |
| `vitest` | 단위 테스트 실행에 사용합니다. |
| `@vitest/coverage-v8` | 테스트 커버리지 수집에 사용합니다. |

## 제거 후보를 볼 때의 기준

- `src`, `App.tsx`, `app.config.ts`, `scripts`, `android`, `supabase`에서 참조되지 않으면 제거 후보입니다.
- 네이티브 의존성을 제거하거나 버전을 바꾸면 iOS/Android 재빌드가 필요한지 먼저 확인합니다.
- `android/` 폴더의 위젯 관련 코드는 현재 Android 위젯 기능 때문에 유지합니다.
- `assets/app/`은 앱 런타임과 네이티브 아이콘에 필요합니다. `store-assets/`는 스토어 제출용 자료라 EAS 업로드에서 제외합니다.
