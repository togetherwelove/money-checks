import { SubscriptionConfig } from "./subscription";

export const LedgerBookManagementCopy = {
  createAction: "가계부 추가",
  createError: "가계부를 만들지 못했어요. plus 가입 직후라면 구독을 복원한 뒤 다시 시도해주세요.",
  createLimitReached: "사용 가능한 가계부 개수를 모두 사용했어요.",
  createNamePlaceholder: "새 가계부 이름",
  createSuccess: "새 가계부로 전환했어요.",
  currentBadge: "사용 중",
  emptyList: "사용 가능한 가계부가 없어요.",
  freeLimitHint: `Free는 ${SubscriptionConfig.freeOwnedLedgerBookLimit}개, plus는 ${SubscriptionConfig.plusOwnedLedgerBookLimit}개까지 소유할 수 있어요.`,
  listTitle: "내 가계부",
  ownerBadge: "소유",
  sharedBadge: "공유",
  switchActionAccessibilityLabel: "가계부 전환",
  switchError: "가계부를 전환하지 못했어요.",
  switchSuccess: "가계부를 전환했어요.",
  upgradeAction: "plus 보기",
} as const;
