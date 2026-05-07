import { selectStaticCopy } from "../i18n/staticCopy";
import { CommonActionCopy } from "./commonActions";

const LedgerBookNicknameLocalizedCopy = selectStaticCopy({
  en: {
    defaultName: "My Ledger",
    inputPlaceholder: "Enter ledger name",
    editActionAccessibilityLabel: "Edit ledger name",
    saveSuccess: "Ledger name saved.",
    saveError: "Could not save ledger name.",
  },
  ko: {
    defaultName: "나의 가계부",
    inputPlaceholder: "가계부 이름 입력",
    editActionAccessibilityLabel: "가계부 이름 수정",
    saveSuccess: "가계부 이름을 저장했어요.",
    saveError: "가계부 이름을 저장하지 못했어요.",
  },
} as const);

export const LedgerBookNicknameCopy = {
  ...LedgerBookNicknameLocalizedCopy,
  saveAction: CommonActionCopy.save,
  cancelAction: CommonActionCopy.cancel,
  actionMinWidth: 72,
} as const;
