import { CommonActionCopy } from "./commonActions";

export const LedgerBookNicknameCopy = {
  defaultName: "나의 가계부",
  inputPlaceholder: "가계부 이름 입력",
  editActionAccessibilityLabel: "가계부 이름 수정",
  saveAction: CommonActionCopy.save,
  cancelAction: CommonActionCopy.cancel,
  saveSuccess: "가계부 이름을 저장했어요.",
  actionMinWidth: 72,
} as const;
