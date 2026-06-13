import { selectStaticCopy } from "../i18n/staticCopy";

export const ShareLedgerMessages = selectStaticCopy({
  en: {
    copyCodeAction: "Copy Share Code",
    copyCodeAccessibilityLabel: "Copy share code",
    copyCodeSuccessToast: "Share code copied.",
    joinAccessibleLimitError: "You have used all available ledgers.",
    joinCooldownError: "Please send another join request shortly.",
    joinExpiredCodeError: "This share code has expired. Get a new code and try again.",
    joinInvalidCodeError: "Invalid share code.",
    joinPendingRequestError: "You already sent a join request. Please wait.",
    joinRequiresPersonalLedgerMergeConfirmationError:
      "Confirm the personal ledger merge before sending this request.",
    joinSharedEditorFreeBlockedError:
      "Leave your current shared ledger or upgrade to plus before joining another ledger.",
    joinSharedOwnerFreeBlockedError:
      "Remove members from your current shared ledger or upgrade to plus before joining another ledger.",
  },
  ko: {
    copyCodeAction: "공유 코드 복사하기",
    copyCodeAccessibilityLabel: "공유 코드 복사",
    copyCodeSuccessToast: "공유 코드를 복사했어요.",
    joinAccessibleLimitError: "사용 가능한 가계부 개수를 모두 사용했어요.",
    joinCooldownError: "잠시 후 다시 참여 요청을 보내 주세요.",
    joinExpiredCodeError: "만료된 공유 코드예요. 새 코드를 받아 다시 시도해 주세요.",
    joinInvalidCodeError: "유효하지 않은 공유 코드예요.",
    joinPendingRequestError: "이미 보낸 참여 요청이 있어요. 잠시만 기다려 주세요.",
    joinRequiresPersonalLedgerMergeConfirmationError:
      "개인 가계부 병합에 동의한 뒤 참여 요청을 보내 주세요.",
    joinSharedEditorFreeBlockedError:
      "현재 공유 가계부에서 나가거나 plus로 전환한 뒤 다른 가계부에 참여해 주세요.",
    joinSharedOwnerFreeBlockedError:
      "현재 가계부의 구성원을 정리하거나 plus로 전환한 뒤 다른 가계부에 참여해 주세요.",
  },
} as const);
