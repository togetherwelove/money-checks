import type * as Notifications from "expo-notifications";

import type { AppLanguage } from "../../i18n/types";
import type { LedgerAppScreen } from "../../types/app";

export const NotificationCategoryIds = {
  entryChange: "ledger_entry_change",
  expenseThreshold: "expense_threshold",
  joinRequest: "ledger_join_request",
  ledgerBookUpdate: "ledger_book_update",
  monthlySummary: "monthly_summary",
} as const;

export const NotificationActionIds = {
  openBook: "open_book",
  openCharts: "open_charts",
  openEntry: "open_entry",
  reviewJoinRequest: "review_join_request",
} as const;

export const NotificationActionPayloadRoutes = {
  allEntries: "all-entries",
  calendar: "calendar",
  charts: "charts",
  share: "share",
} as const satisfies Record<string, LedgerAppScreen>;

export type NotificationActionPayloadRoute =
  (typeof NotificationActionPayloadRoutes)[keyof typeof NotificationActionPayloadRoutes];

export type NotificationActionPayload = {
  actionRoute?: NotificationActionPayloadRoute;
};

const NotificationActionCopyByLanguage = {
  en: {
    openBook: "View Ledger",
    openCharts: "View Charts",
    openEntry: "View Entries",
    reviewJoinRequest: "Review Request",
    viewSummary: "View Summary",
  },
  ko: {
    openBook: "가계부 보기",
    openCharts: "차트 보기",
    openEntry: "내역 보기",
    reviewJoinRequest: "요청 확인",
    viewSummary: "요약 보기",
  },
} as const satisfies Record<AppLanguage, Record<string, string>>;

export function buildNotificationActionCategoryDefinitions(language: AppLanguage): readonly {
  actions: Notifications.NotificationAction[];
  identifier: string;
}[] {
  const notificationActionCopy = NotificationActionCopyByLanguage[language];

  return [
    {
      actions: [
        {
          buttonTitle: notificationActionCopy.openEntry,
          identifier: NotificationActionIds.openEntry,
          options: {
            isAuthenticationRequired: true,
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
        {
          buttonTitle: notificationActionCopy.openBook,
          identifier: NotificationActionIds.openBook,
          options: {
            isAuthenticationRequired: true,
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
      ],
      identifier: NotificationCategoryIds.entryChange,
    },
    {
      actions: [
        {
          buttonTitle: notificationActionCopy.openCharts,
          identifier: NotificationActionIds.openCharts,
          options: {
            isAuthenticationRequired: true,
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
      ],
      identifier: NotificationCategoryIds.expenseThreshold,
    },
    {
      actions: [
        {
          buttonTitle: notificationActionCopy.reviewJoinRequest,
          identifier: NotificationActionIds.reviewJoinRequest,
          options: {
            isAuthenticationRequired: true,
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
      ],
      identifier: NotificationCategoryIds.joinRequest,
    },
    {
      actions: [
        {
          buttonTitle: notificationActionCopy.openBook,
          identifier: NotificationActionIds.openBook,
          options: {
            isAuthenticationRequired: true,
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
      ],
      identifier: NotificationCategoryIds.ledgerBookUpdate,
    },
    {
      actions: [
        {
          buttonTitle: notificationActionCopy.viewSummary,
          identifier: NotificationActionIds.openCharts,
          options: {
            isAuthenticationRequired: true,
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
      ],
      identifier: NotificationCategoryIds.monthlySummary,
    },
  ];
}

export function resolveNotificationActionRoute(
  actionIdentifier: string,
  data: Record<string, unknown> | undefined,
): LedgerAppScreen {
  const payloadRoute =
    typeof data?.actionRoute === "string"
      ? resolveNotificationPayloadRoute(data.actionRoute)
      : null;

  if (payloadRoute) {
    return payloadRoute;
  }

  if (actionIdentifier === NotificationActionIds.openEntry) {
    return NotificationActionPayloadRoutes.allEntries;
  }

  if (actionIdentifier === NotificationActionIds.openCharts) {
    return NotificationActionPayloadRoutes.charts;
  }

  if (actionIdentifier === NotificationActionIds.reviewJoinRequest) {
    return NotificationActionPayloadRoutes.share;
  }

  return NotificationActionPayloadRoutes.calendar;
}

function resolveNotificationPayloadRoute(route: string): LedgerAppScreen | null {
  if (
    route === NotificationActionPayloadRoutes.calendar ||
    route === NotificationActionPayloadRoutes.allEntries ||
    route === NotificationActionPayloadRoutes.charts ||
    route === NotificationActionPayloadRoutes.share
  ) {
    return route;
  }

  return null;
}
