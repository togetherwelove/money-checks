import { selectStaticCopy } from "../i18n/staticCopy";

export const SharedLedgerJoinCopy = selectStaticCopy({
  en: {
    requiredShareCodeError: "Enter a share code.",
  },
  ko: {
    requiredShareCodeError: "공유 코드를 입력해 주세요.",
  },
} as const);
