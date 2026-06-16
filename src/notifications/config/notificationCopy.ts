import type {
  NotificationEventType,
  NotificationPreferenceGroupId,
  NotificationThresholdKey,
  NotificationThresholdPeriod,
} from "../domain/notificationEvents";

type NotificationEventDefinition = {
  bodyTemplate: string;
  defaultEnabled: boolean;
  groupId: NotificationPreferenceGroupId;
  helpMessage?: string;
  label: string;
  title: string;
};

const NotificationUiLocalizedCopy = {
    entryTypeLabels: {
      expense: "지출",
      income: "수입",
    },
    fallbackActorName: "멤버",
    fallbackBookName: "공유 가계부",
    fallbackCategory: "미분류",
    fallbackContent: "내용 없음",
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
  } as const;

export const NotificationUiCopy = {
  ...NotificationUiLocalizedCopy,
  badgePath: "/apple-touch-icon.png",
  iconPath: "/logo192.png",
} as const;

export const NotificationSettingsUi = {
  permissionChevronIconSize: 16,
} as const;

export const NotificationGroupCopy: Record<NotificationPreferenceGroupId, { title: string }> =
  {
      sharedLedger: {
        title: "공유 가계부 활동",
      },
      threshold: {
        title: "금액 기준 알림",
      },
    };

export const NotificationGroupOrder = [
  "sharedLedger",
  "threshold",
] as const satisfies readonly NotificationPreferenceGroupId[];

export const NotificationThresholdCopy: Record<NotificationThresholdKey, { label: string }> =
  {
      expenseAmountDay: {
        label: "하루 지출 기준",
      },
      expenseAmountWeek: {
        label: "한 주 지출 기준",
      },
      expenseAmountMonth: {
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

export const NotificationThresholdPeriodCopy: Record<NotificationThresholdPeriod, string> =
  {
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

export const NotificationEventCopy: Record<NotificationEventType, NotificationEventDefinition> =
  {
      expense_limit_exceeded: {
        bodyTemplate:
          "{periodLabel} 지출 합계 기준을 넘었어요.\n현재 총 {totalAmountLabel} 지출했어요.",
        defaultEnabled: true,
        groupId: "threshold",
        label: "지출 기준 초과",
        title: "지출 기준 초과",
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
        bodyTemplate: "{actorName} · {amountLabel} · {content}",
        defaultEnabled: true,
        groupId: "sharedLedger",
        label: "다른 멤버가 등록했을 때 내게 알립니다.",
        title: "{category} · {entryTypeLabel}",
      },
    };

export const NotificationEntryChangeEventTypes = [
  "other_member_created_entry",
] as const satisfies readonly NotificationEventType[];

export const NotificationEntryChangePreferenceCopy = {
    label: "다른 멤버가 내역을 등록할 때",
  } as const;

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
] as const satisfies readonly NotificationEventType[];

export const NotificationThresholdFieldLabels: Record<NotificationThresholdKey, string> =
  {
      expenseAmountDay: "하루에",
      expenseAmountWeek: "한 주에",
      expenseAmountMonth: "한 달에",
    };

export const NotificationThresholdAmountCopy = {
    exceededLabel: "초과 시",
    placeholder: "금액",
  } as const;
