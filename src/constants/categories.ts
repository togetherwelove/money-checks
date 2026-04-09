import type { LedgerEntryType } from "../types/ledger";

export const CATEGORY_OPTIONS: Record<LedgerEntryType, string[]> = {
  income: ["급여", "용돈", "환급", "판매", "이자", "기타"],
  expense: [
    "식비",
    "카페",
    "교통",
    "생활",
    "쇼핑",
    "주거",
    "의료",
    "구독",
    "여가",
    "경조사",
    "기타",
  ],
} as const;
