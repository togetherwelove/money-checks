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
  defaultStatus: "이 기기의 알림 권한을 아직 선택하지 않았습니다.",
  enabledStatus: "이 기기에서 알림을 받을 수 있습니다.",
  entryTypeLabels: {
    expense: "지출",
    income: "수입",
  },
  fallbackActorName: "멤버",
  fallbackBookName: "공유 가계부",
  fallbackCategory: "미분류",
  fallbackDateLabel: "오늘",
  fallbackEntryTypeLabel: "내역",
  fallbackTargetName: "멤버",
  headerEyebrow: "메뉴",
  iconPath: "/logo192.png",
  menuDescription: "권한과 알림 기준을 관리합니다.",
  menuTitle: "알림설정",
  permissionBlocked:
    "알림 권한이 차단되어 있습니다. iPhone 설정 또는 Safari 설정에서 다시 허용해 주세요.",
  permissionGranted: "허용됨",
  permissionPrompt: "아직 선택 안 함",
  permissionSectionTitle: "기기 알림",
  permissionUnsupported: "이 환경에서는 웹 알림을 지원하지 않습니다.",
  periodFieldLabel: "기간",
  screenSubtitle: "알림 종류를 기능별로 나누어 켜고 끌 수 있습니다.",
  screenTitle: "알림설정",
  unsupportedStatus: "홈 화면에 추가된 웹앱과 지원 브라우저에서만 기기 알림을 사용할 수 있습니다.",
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
  threshold: {
    description: "금액 기준을 넘는 지출이 생기면 알립니다.",
    title: "금액 기준 알림",
  },
};

export const NotificationGroupOrder = [
  "sharedLedger",
  "threshold",
] as const satisfies readonly NotificationPreferenceGroupId[];

export const NotificationThresholdCopy: Record<
  NotificationThresholdKey,
  { description: string; label: string }
> = {
  expenseAmount: {
    description: "선택한 기간의 지출 합계가 이 금액을 넘으면 알림을 보냅니다.",
    label: "지출 기준",
  },
};

export const NotificationDefaultThresholds: Record<NotificationThresholdKey, number> = {
  expenseAmount: 200000,
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
  expenseAmount: "day",
};

export const NotificationEventCopy: Record<NotificationEventType, NotificationEventDefinition> = {
  expense_limit_exceeded: {
    bodyTemplate:
      "{periodLabel} 지출 합계가 {totalAmountLabel}이 되어 기준 {thresholdAmountLabel}을 넘었습니다.",
    defaultEnabled: true,
    description: "선택한 기간의 지출 합계가 설정한 지출 기준을 넘을 때 알립니다.",
    groupId: "threshold",
    label: "지출 기준 초과",
    title: "지출 기준 초과",
  },
  member_left_book: {
    bodyTemplate: "{actorName}님이 {bookName}에서 나갔습니다.",
    defaultEnabled: true,
    description: "다른 멤버가 공유 가계부에서 나가면 알립니다.",
    groupId: "sharedLedger",
    label: "다른 멤버가 나감",
    title: "공유 멤버 나감",
  },
  member_joined_book: {
    bodyTemplate: "{actorName}님이 {bookName}에 참여했습니다.",
    defaultEnabled: true,
    description: "공유 가계부에 새로운 멤버가 참여하면 알립니다.",
    groupId: "sharedLedger",
    label: "새 멤버 참여",
    title: "공유 멤버 참여",
  },
  member_removed_from_book: {
    bodyTemplate: "{actorName}님이 나를 {bookName}에서 제외했습니다.",
    defaultEnabled: true,
    description: "내가 공유 가계부에서 제외되면 알립니다.",
    groupId: "sharedLedger",
    label: "공유 가계부에서 제외",
    title: "공유 가계부에서 제외",
  },
  other_member_created_entry: {
    bodyTemplate:
      "{actorName}님이 {bookName}에 {entryTypeLabel} {amountLabel} 내역을 추가했습니다. 분류: {category}.{noteSentence}",
    defaultEnabled: true,
    description: "다른 멤버가 내역을 새로 추가하면 알립니다.",
    groupId: "sharedLedger",
    label: "다른 멤버가 내역 추가",
    title: "공유 내역 추가",
  },
  other_member_deleted_entry: {
    bodyTemplate:
      "{actorName}님이 {bookName}에서 {entryTypeLabel} {amountLabel} 내역을 삭제했습니다. 분류: {category}.",
    defaultEnabled: true,
    description: "다른 멤버가 내역을 삭제하면 알립니다.",
    groupId: "sharedLedger",
    label: "다른 멤버가 내역 삭제",
    title: "공유 내역 삭제",
  },
  other_member_updated_entry: {
    bodyTemplate:
      "{actorName}님이 {bookName}의 {entryTypeLabel} {amountLabel} 내역을 수정했습니다. 분류: {category}.{noteSentence}",
    defaultEnabled: true,
    description: "다른 멤버가 내역을 수정하면 알립니다.",
    groupId: "sharedLedger",
    label: "다른 멤버가 내역 수정",
    title: "공유 내역 수정",
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
] as const satisfies readonly NotificationEventType[];
