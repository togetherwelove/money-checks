import type { SupportedLocale } from "./types.ts";

export const functionI18nResources = {
  en: {
    categories: {
      expense: {
        beauty: "Beauty",
        dining: "Dining",
        education: "Education",
        food: "Food",
        leisure: "Leisure",
        living: "Living",
        medical: "Medical",
        occasion: "Events",
        other: "Other",
        publicUtilities: "Utilities",
        shopping: "Shopping",
        subscription: "Subscriptions",
        transport: "Transport",
      },
      income: {
        bonus: "Bonus",
        interest: "Interest",
        other: "Other",
        refund: "Refund",
        resale: "Resale",
        salary: "Salary",
        sideIncome: "Side Income",
      },
    },
    push: {
      entryCreated: {
        body: "{{actorName}} added {{category}} {{amount}}.",
        title: "Entry Added",
      },
      entryDeleted: {
        body: "{{actorName}} deleted {{category}} {{amount}}.",
        title: "Entry Deleted",
      },
      entryUpdated: {
        body: "{{actorName}} updated {{category}} {{amount}}.",
        title: "Entry Updated",
      },
      expenseLimitExceeded: {
        body: "{{period}} expenses reached {{totalAmount}}.",
        title: "Expense Limit Exceeded",
      },
      fallbacks: {
        member: "Member",
        period: "period",
        sharedLedger: "shared ledger",
        uncategorized: "uncategorized",
      },
      joinRequest: {
        body: "{{requesterName}} requested access to {{bookName}}.",
        title: "Join Request",
      },
      memberJoinedBook: {
        body: "{{actorName}} joined {{bookName}}.",
        title: "Shared Ledger Member Joined",
      },
      memberLeftBook: {
        body: "{{actorName}} left {{bookName}}.",
        title: "Shared Ledger Member Left",
      },
      memberRemovedFromBook: {
        body: "{{actorName}} removed you from {{bookName}}.",
        title: "Removed from Shared Ledger",
      },
    },
  },
  ko: {
    categories: {
      expense: {
        beauty: "미용",
        dining: "외식",
        education: "교육",
        food: "식비",
        leisure: "여가",
        living: "생활",
        medical: "의료",
        occasion: "경조사",
        other: "기타",
        publicUtilities: "공과금",
        shopping: "쇼핑",
        subscription: "구독",
        transport: "교통",
      },
      income: {
        bonus: "성과급",
        interest: "이자",
        other: "기타",
        refund: "환급",
        resale: "중고판매",
        salary: "급여",
        sideIncome: "부수입",
      },
    },
    push: {
      entryCreated: {
        body: "{{actorName}}님이 {{category}} {{amount}}을 추가했어요.",
        title: "내역 추가",
      },
      entryDeleted: {
        body: "{{actorName}}님이 {{category}} {{amount}}을 삭제했어요.",
        title: "내역 삭제",
      },
      entryUpdated: {
        body: "{{actorName}}님이 {{category}} {{amount}}을 수정했어요.",
        title: "내역 수정",
      },
      expenseLimitExceeded: {
        body: "{{period}} 지출 합계가 {{totalAmount}}에 도달했어요.",
        title: "지출 기준 초과",
      },
      fallbacks: {
        member: "구성원",
        period: "기간",
        sharedLedger: "공유 가계부",
        uncategorized: "미분류",
      },
      joinRequest: {
        body: "{{requesterName}}님이 {{bookName}} 참여를 요청했어요.",
        title: "참여 요청",
      },
      memberJoinedBook: {
        body: "{{actorName}}님이 {{bookName}}에 참여했어요.",
        title: "공유 가계부 참여",
      },
      memberLeftBook: {
        body: "{{actorName}}님이 {{bookName}}에서 나갔어요.",
        title: "공유 가계부 나가기",
      },
      memberRemovedFromBook: {
        body: "{{actorName}}님이 회원님을 {{bookName}}에서 내보냈어요.",
        title: "공유 가계부 제외",
      },
    },
  },
} as const satisfies Record<SupportedLocale, Record<string, unknown>>;
