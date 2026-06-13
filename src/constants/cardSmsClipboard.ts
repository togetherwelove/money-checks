import { selectStaticCopy } from "../i18n/staticCopy";

const CardSmsClipboardLocalizedCopy = selectStaticCopy({
  en: {
    applyAction: "Register",
    amountCurrencySuffix: " KRW",
    dateDaysAgoSuffix: "days ago",
    dateDaysLaterPrefix: "in",
    dateDaysLaterSuffix: "days",
    directEntryAction: "Enter Manually",
    fallbackDateLabel: "No date",
    todayDateLabel: "Today",
    tomorrowDateLabel: "Tomorrow",
    yesterdayDateLabel: "Yesterday",
  },
  ko: {
    applyAction: "등록",
    amountCurrencySuffix: "원",
    dateDaysAgoSuffix: "일 전",
    dateDaysLaterPrefix: "",
    dateDaysLaterSuffix: "일 후",
    directEntryAction: "직접 등록",
    fallbackDateLabel: "날짜 없음",
    todayDateLabel: "오늘",
    tomorrowDateLabel: "내일",
    yesterdayDateLabel: "어제",
  },
} as const);

export const CardSmsClipboardCopy = {
  ...CardSmsClipboardLocalizedCopy,
  actionPreviewContentMaxLength: 12,
  dateDisplaySeparator: "/",
  actionPreviewSuffix: "",
  modalDismissBeforeSaveDelayMs: 320,
  previewOmissionIndicator: "...",
  previewSeparator: " · ",
} as const;
