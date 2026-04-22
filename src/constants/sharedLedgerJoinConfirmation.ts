import { CommonActionCopy } from "./commonActions";

export const SharedLedgerJoinConfirmationCopy = {
  cancelAction: CommonActionCopy.cancel,
  confirmAction: CommonActionCopy.confirm,
  message:
    "현재 가계부에 기록이 있어요. 공유 가계부를 요청하면 기존 기록이 덮어써질 수 있어요. 계속할까요?",
  title: "기존 기록 덮어쓰기",
} as const;
