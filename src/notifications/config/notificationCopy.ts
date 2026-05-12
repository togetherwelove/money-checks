import { selectStaticCopy } from "../../i18n/staticCopy";
import type {
  NotificationEventType,
  NotificationPreferenceGroupId,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../domain/notificationEvents";

type NotificationEventDefinition = {
  bodyTemplate: string;
  defaultEnabled: boolean;
  expenseBodyTemplate?: string;
  groupId: NotificationPreferenceGroupId;
  helpMessage?: string;
  incomeBodyTemplate?: string;
  label: string;
  title: string;
};

const NotificationUiLocalizedCopy = selectStaticCopy({
  en: {
    entryTypeLabels: {
      expense: "Expense",
      income: "Income",
    },
    fallbackActorName: "Member",
    fallbackBookName: "Shared ledger",
    fallbackCategory: "Uncategorized",
    fallbackDateLabel: "Today",
    fallbackEntryTypeLabel: "Entry",
    fallbackTargetName: "Member",
    helpAccessibilitySuffix: "help",
    menuDescription: "Manage alert permissions and limits.",
    noteSegmentPrefix: " / Memo ",
    noteSentencePrefix: " Memo: ",
    permissionBlocked: "Alerts are blocked. Enable them in iPhone or Safari settings.",
    permissionGranted: "Allowed",
    permissionPrompt: "Not selected yet",
    permissionSectionTitle: "Device Alerts",
    permissionUnsupported: "Alerts are not supported here.",
    periodFieldLabel: "Period",
    screenSubtitle: "Turn alert types on or off.",
    screenTitle: "Alert Settings",
    unsupportedStatus: "Device alerts are only available in supported browsers.",
    zeroAmountLabel: "0 KRW",
  },
  ko: {
    entryTypeLabels: {
      expense: "지출",
      income: "수입",
    },
    fallbackActorName: "멤버",
    fallbackBookName: "공유 가계부",
    fallbackCategory: "미분류",
    fallbackDateLabel: "오늘",
    fallbackEntryTypeLabel: "기록",
    fallbackTargetName: "멤버",
    helpAccessibilitySuffix: "도움말",
    menuDescription: "권한과 알림 기준을 관리합니다.",
    noteSegmentPrefix: " / 메모 ",
    noteSentencePrefix: " 메모: ",
    permissionBlocked:
      "알림 권한이 차단되어 있습니다. iPhone 설정 또는 Safari 설정에서 다시 허용해 주세요.",
    permissionGranted: "허용됨",
    permissionPrompt: "아직 선택 안 함",
    permissionSectionTitle: "기기 알림",
    permissionUnsupported: "이 환경에서는 알림을 지원하지 않습니다.",
    periodFieldLabel: "기간",
    screenSubtitle: "알림 종류를 기능별로 나누어 켜고 끌 수 있습니다.",
    screenTitle: "푸시 알림 설정",
    unsupportedStatus: "현재는 추가 설정 없이 지원 브라우저에서만 기기 알림을 사용할 수 있습니다.",
    zeroAmountLabel: "0원",
  },
} as const);

export const NotificationUiCopy = {
  ...NotificationUiLocalizedCopy,
  badgePath: "/apple-touch-icon.png",
  iconPath: "/logo192.png",
} as const;

export const NotificationSettingsUi = {
  permissionChevronIconSize: 16,
} as const;

export const NotificationGroupCopy: Record<NotificationPreferenceGroupId, { title: string }> =
  selectStaticCopy({
    en: {
      sharedLedger: {
        title: "Shared Activity",
      },
      summary: {
        title: "Monthly Summary",
      },
      threshold: {
        title: "Expense Limits",
      },
    },
    ko: {
      sharedLedger: {
        title: "공유 가계부 활동",
      },
      summary: {
        title: "지난달 요약",
      },
      threshold: {
        title: "금액 기준 알림",
      },
    },
  });

export const NotificationGroupOrder = [
  "sharedLedger",
  "threshold",
  "summary",
] as const satisfies readonly NotificationPreferenceGroupId[];

export const NotificationThresholdCopy: Record<NotificationThresholdKey, { label: string }> =
  selectStaticCopy({
    en: {
      expenseAmountDay: {
        label: "Daily limit",
      },
      expenseAmountWeek: {
        label: "Weekly limit",
      },
      expenseAmountMonth: {
        label: "Monthly limit",
      },
    },
    ko: {
      expenseAmountDay: {
        label: "하루 지출 기준",
      },
      expenseAmountWeek: {
        label: "한 주 지출 기준",
      },
      expenseAmountMonth: {
        label: "한 달 지출 기준",
      },
    },
  });

export const NotificationDefaultThresholds: Record<NotificationThresholdKey, number> = {
  expenseAmountDay: 200000,
  expenseAmountWeek: 0,
  expenseAmountMonth: 0,
};

export const NotificationDefaultThresholdEnabled: Record<NotificationThresholdKey, boolean> = {
  expenseAmountDay: true,
  expenseAmountWeek: false,
  expenseAmountMonth: false,
};

export const NotificationThresholdPeriodCopy: Record<NotificationThresholdPeriod, string> =
  selectStaticCopy({
    en: {
      day: "Day",
      week: "Week",
      month: "Month",
    },
    ko: {
      day: "하루",
      week: "한 주",
      month: "한 달",
    },
  });

export const NotificationThresholdPeriodOrder = [
  "day",
  "week",
  "month",
] as const satisfies readonly NotificationThresholdPeriod[];

export const NotificationDefaultThresholdPeriods: Record<
  NotificationThresholdKey,
  NotificationThresholdPeriod
> = {
  expenseAmountDay: "day",
  expenseAmountWeek: "week",
  expenseAmountMonth: "month",
};

export const NotificationEventCopy: Record<NotificationEventType, NotificationEventDefinition> =
  selectStaticCopy({
    en: {
      expense_limit_exceeded: {
        bodyTemplate:
          "{periodLabel} expense limit was reached.\nTotal expense: {totalAmountLabel}.",
        defaultEnabled: true,
        groupId: "threshold",
        label: "Expense limit reached",
        title: "Expense Limit Reached",
      },
      month_end_summary: {
        bodyTemplate:
          "{currentMonthLabel} ledger summary.\nIncome: {incomeSummary}\nExpense: {expenseSummary}",
        defaultEnabled: false,
        groupId: "summary",
        helpMessage:
          "On the 1st of each month, this summarizes last month's income, expenses, and month-over-month changes.\n\nExample\nTitle: March income and expense review\nBody: March ledger summary.\nIncome: Earned 120,000 KRW more than last month\nExpense: Spent 35,000 KRW less than last month",
        label: "Monthly summary on the 1st",
        title: "{currentMonthLabel} Review",
      },
      member_left_book: {
        bodyTemplate: "{actorName} left {bookName}.",
        defaultEnabled: true,
        groupId: "sharedLedger",
        label: "Other member left",
        title: "Shared Member Left",
      },
      member_joined_book: {
        bodyTemplate: "{actorName} joined {bookName}.",
        defaultEnabled: true,
        groupId: "sharedLedger",
        label: "New member joined",
        title: "Shared Member Joined",
      },
      member_removed_from_book: {
        bodyTemplate: "{actorName} removed you from {bookName}.",
        defaultEnabled: true,
        groupId: "sharedLedger",
        label: "Removed from shared ledger",
        title: "Removed from Shared Ledger",
      },
      other_member_created_entry: {
        bodyTemplate: "{actorName} added {category} {amountLabel}.\n{noteSentence}",
        defaultEnabled: true,
        expenseBodyTemplate: "{actorName} spent {amountLabel} on {category}.\n{noteSentence}",
        groupId: "sharedLedger",
        incomeBodyTemplate: "{actorName} earned {amountLabel} from {category}.\n{noteSentence}",
        label: "Member adds entry",
        title: "Entry Added",
      },
    },
    ko: {
      expense_limit_exceeded: {
        bodyTemplate:
          "{periodLabel} 지출 합계 기준을 넘었어요.\n현재 총 {totalAmountLabel} 지출했어요.",
        defaultEnabled: true,
        groupId: "threshold",
        label: "지출 기준 초과",
        title: "지출 기준 초과",
      },
      month_end_summary: {
        bodyTemplate:
          "{currentMonthLabel} 가계부 요약입니다.\n수입: {incomeSummary}\n지출: {expenseSummary}",
        defaultEnabled: false,
        groupId: "summary",
        helpMessage:
          "매월 1일에 지난달 수입·지출과 전월 대비 변화를 요약해 알려드려요.\n\n예시\n제목: 3월 입출금 돌아보기\n본문: 3월 가계부 요약입니다.\n수입: 전월보다 120,000원 더 벌었어요\n지출: 전월보다 35,000원 덜 썼어요",
        label: "매월 1일에 지난달 요약 알림 보내기",
        title: "{currentMonthLabel} 입출금 돌아보기",
      },
      member_left_book: {
        bodyTemplate: "{actorName}님이 {bookName}에서 나갔어요.",
        defaultEnabled: true,
        groupId: "sharedLedger",
        label: "다른 멤버가 나감",
        title: "공유 멤버 나감",
      },
      member_joined_book: {
        bodyTemplate: "{actorName}님이 {bookName}에 참여했어요.",
        defaultEnabled: true,
        groupId: "sharedLedger",
        label: "새 멤버 참여",
        title: "공유 멤버 참여",
      },
      member_removed_from_book: {
        bodyTemplate: "{actorName}님이 나를 {bookName}에서 제외했어요.",
        defaultEnabled: true,
        groupId: "sharedLedger",
        label: "공유 가계부에서 제외",
        title: "공유 가계부에서 제외",
      },
      other_member_created_entry: {
        bodyTemplate: "{actorName}님이 {category} {amountLabel}을 추가했어요.\n{noteSentence}",
        defaultEnabled: true,
        expenseBodyTemplate:
          "{actorName}님이 {category}에서 {amountLabel} 나갔어요.\n{noteSentence}",
        groupId: "sharedLedger",
        incomeBodyTemplate:
          "{actorName}님이 {category}에서 {amountLabel} 들어왔어요.\n{noteSentence}",
        label: "다른 멤버가 등록했을 때 내게 알립니다.",
        title: "기록 추가",
      },
    },
  });

export const NotificationEntryChangeEventTypes = [
  "other_member_created_entry",
] as const satisfies readonly NotificationEventType[];

export const NotificationEntryChangePreferenceCopy = selectStaticCopy({
  en: {
    label: "When another member adds entries",
  },
  ko: {
    label: "다른 멤버가 내역을 등록할 때",
  },
} as const);

export const NotificationRequiredEvents = [
  "member_joined_book",
  "member_left_book",
  "member_removed_from_book",
] as const satisfies readonly NotificationEventType[];

const notificationRequiredEventSet = new Set<NotificationEventType>(NotificationRequiredEvents);

export function isRequiredNotificationEvent(eventType: NotificationEventType): boolean {
  return notificationRequiredEventSet.has(eventType);
}

export const NotificationEventOrder = [
  "other_member_created_entry",
  "member_joined_book",
  "member_left_book",
  "member_removed_from_book",
  "expense_limit_exceeded",
  "month_end_summary",
] as const satisfies readonly NotificationEventType[];

export const NotificationThresholdFieldLabels: Record<NotificationThresholdKey, string> =
  selectStaticCopy({
    en: {
      expenseAmountDay: "Daily",
      expenseAmountWeek: "Weekly",
      expenseAmountMonth: "Monthly",
    },
    ko: {
      expenseAmountDay: "하루에",
      expenseAmountWeek: "한 주에",
      expenseAmountMonth: "한 달에",
    },
  });

export const NotificationThresholdAmountCopy = selectStaticCopy({
  en: {
    exceededLabel: "exceeded",
    placeholder: "Amount",
  },
  ko: {
    exceededLabel: "초과 시",
    placeholder: "금액",
  },
} as const);
