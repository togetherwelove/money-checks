# 의존성 목적 정리

이 문서는 앱에 들어간 주요 의존성이 어떤 기능 때문에 필요한지 빠르게 확인하기 위한 문서입니다.

## 기준

- Expo SDK 55 환경을 기준으로 정리합니다.
- native 의존성은 버전이 바뀌면 iOS/Android 재빌드가 필요할 수 있습니다.
- 이유가 불명확한 의존성은 새로 추가하지 않습니다.

## 앱 기반

| 의존성 | 필요한 이유 |
| --- | --- |
| `expo` | Expo SDK, config plugin, 개발 서버, EAS 빌드 기반입니다. |
| `react` | React Native 화면을 구성하는 React 런타임입니다. |
| `react-native` | iOS/Android 앱의 기본 네이티브 런타임입니다. |
| `@expo/metro-runtime` | Expo Metro 번들 런타임입니다. |
| `babel-preset-expo` | Expo 프로젝트의 Babel 변환 preset입니다. |
| `@types/react` | TypeScript에서 React 타입 검사를 하기 위해 필요합니다. |

## 화면과 내비게이션

| 의존성 | 필요한 이유 |
| --- | --- |
| `@react-navigation/native` | 앱의 내비게이션 상태와 컨테이너를 관리합니다. |
| `@react-navigation/native-stack` | iOS/Android native stack 기반 화면 전환에 사용합니다. |
| `react-native-screens` | native-stack이 사용하는 native screen primitive입니다. |
| `react-native-safe-area-context` | 노치, 홈 인디케이터 등 안전 영역 처리를 위해 필요합니다. |
| `react-native-gesture-handler` | 네이티브 제스처 처리와 내비게이션 제스처에 필요합니다. |
| `react-native-reanimated` | 제스처/전환/애니메이션 기반 기능에 필요합니다. |
| `react-native-worklets` | Reanimated 4와 New Architecture 환경에서 필요한 worklet 런타임입니다. |
| `react-native-keyboard-aware-scroll-view` | 입력 화면에서 키보드가 입력창을 가리지 않도록 스크롤을 보정합니다. |
| `react-native-pager-view` | 월 캘린더와 차트의 스와이프 페이지 전환에 사용합니다. |

## 인증과 보안 저장소

| 의존성 | 필요한 이유 |
| --- | --- |
| `@supabase/supabase-js` | Supabase Auth, Database, Edge Function 호출에 사용합니다. |
| `expo-apple-authentication` | iOS Sign in with Apple에 필요합니다. |
| `expo-auth-session` | Google OAuth 등 외부 인증 세션 처리에 사용합니다. |
| `expo-crypto` | 인증/보안 흐름에서 난수나 해시가 필요할 때 사용합니다. |
| `expo-secure-store` | 민감한 로컬 값을 OS 보안 저장소에 저장할 때 사용합니다. |
| `react-native-url-polyfill` | Supabase 등 URL API를 기대하는 라이브러리 호환성을 위해 필요합니다. |

## 알림과 백그라운드 작업

| 의존성 | 필요한 이유 |
| --- | --- |
| `expo-notifications` | 푸시 알림, 알림 권한, 알림 액션 카테고리에 사용합니다. |
| `expo-task-manager` | 백그라운드 알림/위젯 동기화 작업 등록에 사용합니다. |
| `expo-device` | 푸시 토큰 등록 전 실제 기기 여부 등 기기 정보를 확인합니다. |

## 데이터, 파일, 공유

| 의존성 | 필요한 이유 |
| --- | --- |
| `expo-sqlite` | 앱 내부 로컬 저장소와 캐시에 사용합니다. |
| `expo-file-system` | 엑셀/리포트 파일 생성과 임시 파일 처리에 사용합니다. |
| `expo-sharing` | 생성한 파일을 OS 공유 시트로 내보낼 때 사용합니다. |
| `expo-mail-composer` | 문의 메일 작성 화면을 열 때 사용합니다. |
| `xlsx` | 가계부 내역과 연간 리포트를 엑셀 파일로 만들 때 사용합니다. |

## 미디어와 UI 표현

| 의존성 | 필요한 이유 |
| --- | --- |
| `@expo/vector-icons` | 버튼과 메뉴의 아이콘 표시를 위해 사용합니다. |
| `expo-font` | 아이콘 폰트와 앱 폰트 로딩에 필요합니다. |
| `react-native-svg` | 차트, 아이콘형 그래픽, SVG 기반 표현에 사용합니다. |
| `expo-linear-gradient` | 구독 화면 등 일부 UI의 그라데이션 표현에 사용합니다. |
| `expo-image-picker` | 이미지 첨부 기능에서 사진 선택 권한과 picker를 제공합니다. |
| `@react-native-community/datetimepicker` | 네이티브 날짜 선택 UI에 사용합니다. |
| `@react-native-picker/picker` | 할부 개월 등 선택형 입력 UI에 사용합니다. |
| `react-native-markdown-display` | 도움말/오픈소스 안내 등 Markdown 렌더링에 사용합니다. |

## 수익화

| 의존성 | 필요한 이유 |
| --- | --- |
| `react-native-google-mobile-ads` | 무료 플랜 광고 배너와 네이티브 광고 표시에 사용합니다. |
| `react-native-purchases` | RevenueCat 구독 상태, 구매, 복원 흐름에 사용합니다. |

## 오버레이와 피드백

| 의존성 | 필요한 이유 |
| --- | --- |
| `react-native-root-siblings` | 앱 루트 바깥에 toast/overlay를 띄우기 위한 기반입니다. |
| `react-native-root-toast` | 사용자 피드백 toast 메시지 표시에 사용합니다. |

## 개발과 검증

| 의존성 | 필요한 이유 |
| --- | --- |
| `typescript` | 타입 검사에 사용합니다. |
| `@biomejs/biome` | 포맷팅과 정적 검사에 사용합니다. |
| `vitest` | 단위 테스트 실행에 사용합니다. |
| `@vitest/coverage-v8` | 테스트 커버리지 수집에 사용합니다. |

## 제거 후보를 볼 때의 기준

- `src`, `App.tsx`, `app.config.ts`, `scripts`, `android` 어디에서도 쓰지 않으면 제거 후보입니다.
- native 의존성을 제거하거나 버전을 바꾸면 iOS/Android 재빌드 필요성을 먼저 판단합니다.
- `android/` 폴더의 위젯 관련 코드는 현재 Android 위젯 기능을 위해 유지합니다.
