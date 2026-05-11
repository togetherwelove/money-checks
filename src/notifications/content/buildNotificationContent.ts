import { formatCurrency, formatSelectedDate } from "../../utils/calendar";
import {
  NotificationEventCopy,
  NotificationThresholdPeriodCopy,
  NotificationUiCopy,
} from "../config/notificationCopy";
import type { NotificationEvent } from "../domain/notificationEvents";

type NotificationContent = {
  body: string;
  title: string;
};

export function buildNotificationContent(event: NotificationEvent): NotificationContent {
  const eventCopy = NotificationEventCopy[event.type];
  const tokenMap = buildTokenMap(event);

  return {
    body: applyTemplate(resolveBodyTemplate(event, eventCopy), tokenMap),
    title: applyTemplate(eventCopy.title, tokenMap),
  };
}

function resolveBodyTemplate(
  event: NotificationEvent,
  eventCopy: (typeof NotificationEventCopy)[NotificationEvent["type"]],
): string {
  if (event.type !== "other_member_created_entry") {
    return eventCopy.bodyTemplate;
  }

  if (event.entryType === "expense") {
    return eventCopy.expenseBodyTemplate ?? eventCopy.bodyTemplate;
  }

  if (event.entryType === "income") {
    return eventCopy.incomeBodyTemplate ?? eventCopy.bodyTemplate;
  }

  return eventCopy.bodyTemplate;
}

function buildTokenMap(event: NotificationEvent): Record<string, string> {
  const note = event.note?.trim() ?? "";
  const entryTypeLabel = event.entryType
    ? NotificationUiCopy.entryTypeLabels[event.entryType]
    : NotificationUiCopy.fallbackEntryTypeLabel;

  return {
    actorName: event.actorName ?? NotificationUiCopy.fallbackActorName,
    amountLabel:
      typeof event.amount === "number"
        ? formatCurrency(event.amount)
        : NotificationUiCopy.zeroAmountLabel,
    bookName: event.bookName ?? NotificationUiCopy.fallbackBookName,
    category: event.category?.trim() || NotificationUiCopy.fallbackCategory,
    currentMonthLabel: event.currentMonthLabel ?? NotificationUiCopy.fallbackDateLabel,
    dateLabel: event.date ? formatSelectedDate(event.date) : NotificationUiCopy.fallbackDateLabel,
    entryTypeLabel,
    expenseSummary: event.expenseSummary ?? NotificationUiCopy.fallbackDateLabel,
    incomeSummary: event.incomeSummary ?? NotificationUiCopy.fallbackDateLabel,
    noteSegment: note ? `${NotificationUiCopy.noteSegmentPrefix}${note}` : "",
    noteSentence: note ? `${NotificationUiCopy.noteSentencePrefix}${note}` : "",
    periodLabel: event.period
      ? NotificationThresholdPeriodCopy[event.period]
      : NotificationUiCopy.fallbackDateLabel,
    targetName: event.targetName ?? NotificationUiCopy.fallbackTargetName,
    thresholdAmountLabel:
      typeof event.thresholdAmount === "number"
        ? formatCurrency(event.thresholdAmount)
        : NotificationUiCopy.zeroAmountLabel,
    totalAmountLabel:
      typeof event.totalAmount === "number"
        ? formatCurrency(event.totalAmount)
        : NotificationUiCopy.zeroAmountLabel,
  };
}

function applyTemplate(template: string, tokenMap: Record<string, string>): string {
  return template.replaceAll(
    /\{([a-zA-Z0-9]+)\}/g,
    (_match, tokenName) => tokenMap[tokenName] ?? "",
  );
}
