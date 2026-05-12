import { selectStaticCopy } from "../i18n/staticCopy";

export const LedgerEditabilityCopy = selectStaticCopy({
  en: {
    planLimitReadOnly:
      "This ledger is read-only because your current plan limit is exceeded. Remove ledgers or subscribe to Alttle plus to edit.",
    readOnlyNoticeDescription: "Editing is disabled for ledgers outside your current plan limit.",
    readOnlyNoticeTitle: "Read-only ledger",
    readOnlyBadge: "Read-only",
  },
  ko: {
    planLimitReadOnly:
      "현재 플랜 한도를 초과해 조회만 가능해요. 가계부를 줄이거나 알뜰 Plus를 다시 구독해 주세요.",
    readOnlyNoticeDescription: "free 플랜 한도 외의 가계부는 등록, 수정, 삭제가 제한돼요.",
    readOnlyNoticeTitle: "이 가계부는 조회만 할 수 있어요.",
    readOnlyBadge: "조회 전용",
  },
} as const);
