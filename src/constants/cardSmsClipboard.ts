import { selectStaticCopy } from "../i18n/staticCopy";

const CardSmsClipboardLocalizedCopy = selectStaticCopy({
  en: {
    applyAction: "Import Copy",
    directEntryAction: "Enter Manually",
    amountCurrencySuffix: " KRW",
    fallbackDateLabel: "No date",
  },
  ko: {
    applyAction: "복사 등록",
    directEntryAction: "직접 등록",
    amountCurrencySuffix: "원",
    fallbackDateLabel: "날짜 없음",
  },
} as const);

export const CardSmsClipboardCopy = {
  ...CardSmsClipboardLocalizedCopy,
  actionPreviewContentMaxLength: 12,
  dateDisplaySeparator: "/",
  actionPreviewSuffix: "",
  previewOmissionIndicator: "...",
  previewSeparator: " · ",
} as const;
