import type { LedgerEntry, LedgerEntryType } from "../types/ledger";
import { addMonths, getMonthKey, toIsoDate } from "../utils/calendar";

type LedgerEntryTemplate = {
  id: string;
  day: number;
  type: LedgerEntryType;
  amount: number;
  category: string;
  note: string;
};

const MONTH_OFFSETS = [-1, 0, 1] as const;

const LEDGER_ENTRY_TEMPLATES: LedgerEntryTemplate[] = [
  {
    id: "income-salary",
    day: 1,
    type: "income",
    amount: 3200000,
    category: "급여",
    note: "월급 입금",
  },
  { id: "expense-rent", day: 2, type: "expense", amount: 850000, category: "주거", note: "월세" },
  {
    id: "expense-coffee",
    day: 3,
    type: "expense",
    amount: 5500,
    category: "식비",
    note: "출근길 커피",
  },
  {
    id: "expense-groceries",
    day: 5,
    type: "expense",
    amount: 68400,
    category: "생활",
    note: "주말 장보기",
  },
  {
    id: "income-freelance",
    day: 7,
    type: "income",
    amount: 420000,
    category: "부수입",
    note: "디자인 외주",
  },
  {
    id: "expense-transport",
    day: 8,
    type: "expense",
    amount: 62000,
    category: "교통",
    note: "교통카드 충전",
  },
  {
    id: "expense-lunch",
    day: 10,
    type: "expense",
    amount: 14000,
    category: "식비",
    note: "팀 점심",
  },
  {
    id: "expense-subscription",
    day: 12,
    type: "expense",
    amount: 17000,
    category: "구독",
    note: "음악 서비스",
  },
  {
    id: "income-refund",
    day: 14,
    type: "income",
    amount: 38000,
    category: "환급",
    note: "주문 취소 환불",
  },
  {
    id: "expense-refund-fee",
    day: 14,
    type: "expense",
    amount: 4500,
    category: "수수료",
    note: "반품 수수료",
  },
  {
    id: "expense-hospital",
    day: 16,
    type: "expense",
    amount: 46300,
    category: "의료",
    note: "정기 검진",
  },
  {
    id: "expense-dinner",
    day: 18,
    type: "expense",
    amount: 72000,
    category: "식비",
    note: "친구 모임",
  },
  {
    id: "income-bonus",
    day: 21,
    type: "income",
    amount: 250000,
    category: "성과급",
    note: "분기 인센티브",
  },
  {
    id: "expense-shopping",
    day: 22,
    type: "expense",
    amount: 128000,
    category: "쇼핑",
    note: "봄 재킷",
  },
  {
    id: "income-resale",
    day: 22,
    type: "income",
    amount: 63000,
    category: "중고판매",
    note: "책 판매",
  },
  {
    id: "expense-family",
    day: 25,
    type: "expense",
    amount: 96000,
    category: "가족",
    note: "가족 식사",
  },
  {
    id: "expense-savings",
    day: 28,
    type: "expense",
    amount: 300000,
    category: "저축",
    note: "비상금 이체",
  },
  {
    id: "income-interest",
    day: 30,
    type: "income",
    amount: 11000,
    category: "이자",
    note: "적금 이자",
  },
];

export function createMockLedgerEntries(referenceDate: Date): LedgerEntry[] {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return LEDGER_ENTRY_TEMPLATES.map((template) => {
    const entryDay = Math.min(template.day, daysInMonth);
    const entryDate = new Date(year, monthIndex, entryDay);

    return {
      id: `${getMonthKey(referenceDate)}-${template.id}`,
      date: toIsoDate(entryDate),
      type: template.type,
      amount: template.amount,
      category: template.category,
      note: template.note,
    };
  });
}

export function createVisibleLedgerEntries(referenceDate: Date): LedgerEntry[] {
  return MONTH_OFFSETS.flatMap((monthOffset) =>
    createMockLedgerEntries(addMonths(referenceDate, monthOffset)),
  );
}
