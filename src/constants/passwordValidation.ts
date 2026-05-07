import { selectStaticCopy } from "../i18n/staticCopy";

export const PasswordValidationPolicy = {
  minimumLength: 8,
} as const;

export const PasswordValidationUi = {
  checklistGap: 6,
  indicatorBorderWidth: 1,
  indicatorSize: 10,
  itemGap: 8,
  itemLineHeight: 18,
  itemTextSize: 12,
  titleLineHeight: 18,
  titleTextSize: 12,
} as const;

export const PasswordValidationCopy = selectStaticCopy({
  en: {
    containsLetter: "Include at least one letter",
    containsNumber: "Include at least one number",
    matchesConfirmation: "Passwords match",
    minimumLength: `Use at least ${PasswordValidationPolicy.minimumLength} characters`,
    title: "Password requirements",
  },
  ko: {
    containsLetter: "영문을 1자 이상 포함",
    containsNumber: "숫자를 1자 이상 포함",
    matchesConfirmation: "비밀번호 확인과 일치",
    minimumLength: `${PasswordValidationPolicy.minimumLength}자 이상 입력`,
    title: "비밀번호 조건",
  },
} as const);
