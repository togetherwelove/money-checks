import type { SupportedLocale } from "./types.ts";

export const functionI18nResources = {
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
        body: "{{actorName}} · {{amount}} · {{content}}",
        title: "{{entryType}} 내역 알림 · {{category}}",
      },
      entryTypes: {
        expense: "지출",
        income: "수입",
      },
      expenseLimitExceeded: {
        body: "{{period}} 지출 합계가 {{totalAmount}}에 도달했어요.",
        title: "지출 기준 초과",
      },
      fallbacks: {
        member: "구성원",
        content: "내용 없음",
        entry: "내역",
        period: "기간",
        sharedLedger: "공유 가계부",
        uncategorized: "미분류",
      },
      joinRequest: {
        body: "{{requesterName}}님이 {{bookName}} 참여를 요청했어요.",
        title: "참여 요청",
      },
      periods: {
        day: "하루",
        month: "한 달",
        week: "한 주",
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
