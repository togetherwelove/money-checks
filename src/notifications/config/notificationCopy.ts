import type {
  NotificationEventType,
  NotificationPreferenceGroupId,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../domain/notificationEvents";

type NotificationEventDefinition = {
  bodyTemplate: string;
  defaultEnabled: boolean;
  description: string;
  groupId: NotificationPreferenceGroupId;
  label: string;
  title: string;
};

export const NotificationUiCopy = {
  badgePath: "/apple-touch-icon.png",
  defaultStatus: "이 기기에서 알림 권한을 아직 선택하지 않았습니다.",
  enabledStatus: "이 기기에서 알림을 받을 수 있습니다.",
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
  iconPath: "/logo192.png",
  menuDescription: "권한과 알림 기준을 관리합니다.",
  menuTitle: "푸시 알림 설정",
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
} as const;

export const NotificationGroupCopy: Record<
  NotificationPreferenceGroupId,
  { description: string; title: string }
> = {
  sharedLedger: {
    description: "공유 가계부에서 다른 멤버가 만든 변화를 알립니다.",
    title: "공유 가계부 활동",
  },
  summary: {
    description: "매월 1일 지난달 수입·지출과 전월 비교를 정리해서 알려드려요.",
    title: "지난달 요약",
  },
  threshold: {
    description: "하루, 한 주, 한 달 지출 기준을 각각 설정할 수 있습니다.",
    title: "금액 기준 알림",
  },
};

export const NotificationGroupOrder = [
  "sharedLedger",
  "threshold",
  "summary",
] as const satisfies readonly NotificationPreferenceGroupId[];

export const NotificationThresholdCopy: Record<
  NotificationThresholdKey,
  { description: string; label: string }
> = {
  expenseAmountDay: {
    description: "하루 지출 합계가 설정한 금액을 넘으면 알림을 보냅니다.",
    label: "하루 지출 기준",
  },
  expenseAmountWeek: {
    description: "한 주 지출 합계가 설정한 금액을 넘으면 알림을 보냅니다.",
    label: "한 주 지출 기준",
  },
  expenseAmountMonth: {
    description: "한 달 지출 합계가 설정한 금액을 넘으면 알림을 보냅니다.",
    label: "한 달 지출 기준",
  },
};

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

export const NotificationThresholdPeriodCopy: Record<NotificationThresholdPeriod, string> = {
  day: "하루",
  week: "한 주",
  month: "한 달",
};

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

export const NotificationEventCopy: Record<NotificationEventType, NotificationEventDefinition> = {
  expense_limit_exceeded: {
    bodyTemplate:
      "{periodLabel} 지출 합계 기준을 넘었어요.\n현재 총 {totalAmountLabel} 지출했어요.",
    defaultEnabled: true,
    description: "설정한 지출 기준을 넘을 때 알림을 보냅니다.",
    groupId: "threshold",
    label: "지출 기준 초과",
    title: "지출 기준 초과",
  },
  month_end_summary: {
    bodyTemplate:
      "{currentMonthLabel} 가계부 요약입니다.\n수입: {incomeSummary}\n지출: {expenseSummary}",
    defaultEnabled: false,
    description: "매월 1일 지난달 수입·지출과 전월 비교를 정리해서 알려드려요.",
    groupId: "summary",
    label: "매월 1일에 지난달 요약 알림 보내기",
    title: "{currentMonthLabel} 입출금 돌아보기",
  },
  member_left_book: {
    bodyTemplate: "{actorName}님이 {bookName}에서 나갔어요.",
    defaultEnabled: true,
    description: "다른 멤버가 공유 가계부에서 나가면 알립니다.",
    groupId: "sharedLedger",
    label: "다른 멤버가 나감",
    title: "공유 멤버 나감",
  },
  member_joined_book: {
    bodyTemplate: "{actorName}님이 {bookName}에 참여했어요.",
    defaultEnabled: true,
    description: "공유 가계부에 새로운 멤버가 참여하면 알립니다.",
    groupId: "sharedLedger",
    label: "새 멤버 참여",
    title: "공유 멤버 참여",
  },
  member_removed_from_book: {
    bodyTemplate: "{actorName}님이 나를 {bookName}에서 제외했어요.",
    defaultEnabled: true,
    description: "내가 공유 가계부에서 제외되면 알립니다.",
    groupId: "sharedLedger",
    label: "공유 가계부에서 제외",
    title: "공유 가계부에서 제외",
  },
  other_member_created_entry: {
    bodyTemplate:
      "{actorName}님이 {category} {amountLabel}을 추가했어요.\n메모: {noteSentence}",
    defaultEnabled: true,
    description: "다른 멤버가 기록을 새로 추가하면 알립니다.",
    groupId: "sharedLedger",
    label: "다른 멤버가 추가했을 때",
    title: "기록 추가",
  },
  other_member_deleted_entry: {
    bodyTemplate:
      "{actorName}님이 {category} {amountLabel} 기록을 삭제했어요.",
    defaultEnabled: true,
    description: "다른 멤버가 기록을 삭제하면 알립니다.",
    groupId: "sharedLedger",
    label: "다른 멤버가 삭제했을 때",
    title: "기록 삭제",
  },
  other_member_updated_entry: {
    bodyTemplate:
      "{actorName}님이 {category} {amountLabel} 기록을 수정했어요.",
    defaultEnabled: true,
    description: "다른 멤버가 기록을 수정하면 알립니다.",
    groupId: "sharedLedger",
    label: "다른 멤버가 수정했을 때",
    title: "기록 수정",
  },
};

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
  "other_member_updated_entry",
  "other_member_deleted_entry",
  "member_joined_book",
  "member_left_book",
  "member_removed_from_book",
  "expense_limit_exceeded",
  "month_end_summary",
] as const satisfies readonly NotificationEventType[];

export const NotificationThresholdFieldLabels: Record<NotificationThresholdKey, string> = {
  expenseAmountDay: "하루에",
  expenseAmountWeek: "한 주에",
  expenseAmountMonth: "한 달에",
};

export const NotificationThresholdAmountCopy = {
  currencyLabel: "원",
  placeholder: "금액",
} as const;
