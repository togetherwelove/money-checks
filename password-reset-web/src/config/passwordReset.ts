export const PasswordRequirements = {
  minimumLength: 6,
} as const;

export const PasswordResetCopy = {
  brand: "알뜰",
  title: "새 비밀번호 만들기",
  subtitle: "새 비밀번호를 입력하면 재설정이 완료됩니다.",
  passwordLabel: "새 비밀번호",
  passwordPlaceholder: "새 비밀번호를 입력해 주세요",
  confirmPasswordLabel: "비밀번호 확인",
  confirmPasswordPlaceholder: "새 비밀번호를 다시 입력해 주세요",
  submitAction: "비밀번호 변경",
  submittingAction: "변경 중…",
  successTitle: "비밀번호가 변경됐어요",
  successDescription: "알뜰 앱으로 돌아가 새 비밀번호로 로그인해 주세요.",
  invalidLinkTitle: "유효하지 않은 재설정 링크예요",
  invalidLinkDescription: "링크가 만료되었거나 이미 사용되었습니다. 알뜰 앱에서 다시 요청해 주세요.",
  sessionLoading: "재설정 링크를 확인하고 있어요…",
  updateError: "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  requirements: {
    minimumLength: `영문 ${PasswordRequirements.minimumLength}자 이상`,
    lowercase: "영문 소문자 포함",
    uppercase: "영문 대문자 포함",
    digit: "숫자 포함",
    confirmation: "비밀번호가 일치함",
  },
} as const;

export const PasswordResetUi = {
  contentMaxWidth: 480,
  screenPadding: 24,
  cardPadding: 24,
  cardRadius: 20,
  fieldGap: 8,
  sectionGap: 20,
} as const;
