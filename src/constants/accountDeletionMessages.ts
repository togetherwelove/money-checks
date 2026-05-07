import { selectStaticCopy } from "../i18n/staticCopy";

export const AccountDeletionMessages = selectStaticCopy({
  en: {
    action: "Delete Account",
    blockedOwnerError:
      "Owners of shared ledgers with remaining members must remove members or end sharing first.",
    confirmHint: "Type 'delete' to permanently delete your account.",
    confirmLabel: "Confirmation Text",
    confirmPlaceholder: "delete",
    deleting: "Deleting your account.",
    description:
      "Deleting your account permanently removes your profile, ledger entries, and memberships.",
    errorFallback: "Could not delete your account. Please try again later.",
    instruction: "This action cannot be undone.",
    openAction: "Delete Account",
    subscriptionWarningContinueAction: "Continue Delete",
    subscriptionWarningDescription:
      "Deleting your account does not cancel the subscription automatically, so billing may continue.",
    subscriptionWarningManageAction: "Manage Subscription",
    subscriptionWarningTitle: "You currently have an active plus subscription.",
    title: "Delete your account?",
    triggerWord: "delete",
  },
  ko: {
    action: "계정 삭제",
    blockedOwnerError:
      "다른 멤버가 남아 있는 공유 가계부 소유자는 먼저 멤버를 정리하거나 공유를 종료해야 해요.",
    confirmHint: "'삭제'를 입력하면 계정이 완전히 삭제돼요.",
    confirmLabel: "확인 문구",
    confirmPlaceholder: "삭제",
    deleting: "계정을 삭제하고 있어요.",
    description: "계정 삭제 시 프로필, 가계부 기록, 참여 정보가 완전히 삭제돼요.",
    errorFallback: "계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
    instruction: "이 작업은 되돌릴 수 없어요.",
    openAction: "계정 삭제",
    subscriptionWarningContinueAction: "계속 삭제",
    subscriptionWarningDescription:
      "구독 상품은 자동으로 취소되지 않으므로 계정을 삭제해도 요금이 계속 청구될 수 있어요.",
    subscriptionWarningManageAction: "구독 관리",
    subscriptionWarningTitle: "현재 plus 구독 중이에요.",
    title: "계정을 삭제할까요?",
    triggerWord: "삭제",
  },
} as const);
