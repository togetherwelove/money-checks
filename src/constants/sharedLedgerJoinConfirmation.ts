import { selectStaticCopy } from "../i18n/staticCopy";
import { CommonActionCopy } from "./commonActions";

const SharedLedgerJoinConfirmationLocalizedCopy = selectStaticCopy({
  en: {
    message:
      "Your current ledger has entries. Requesting a shared ledger may overwrite existing records. Continue?",
    title: "Overwrite Existing Records",
  },
  ko: {
    message:
      "현재 가계부에 기록이 있어요. 공유 가계부를 요청하면 기존 기록이 덮어써질 수 있어요. 계속할까요?",
    title: "기존 기록 덮어쓰기",
  },
} as const);

export const SharedLedgerJoinConfirmationCopy = {
  ...SharedLedgerJoinConfirmationLocalizedCopy,
  cancelAction: CommonActionCopy.cancel,
  confirmAction: CommonActionCopy.confirm,
} as const;
