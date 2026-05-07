import { resolveStaticCopyLanguage, selectStaticCopy } from "../i18n/staticCopy";
import { CommonActionCopy } from "./commonActions";

export const CalendarPickerLocale = resolveStaticCopyLanguage() === "en" ? "en-US" : "ko-KR";

export const CalendarPickerCopy = selectStaticCopy({
  en: {
    closeAction: CommonActionCopy.close,
    yearPickerTitle: "Select Date",
    yearPickerConfirmAction: CommonActionCopy.apply,
    yearPickerNote: "The selected date is applied to the calendar immediately.",
  },
  ko: {
    closeAction: CommonActionCopy.close,
    yearPickerTitle: "날짜 선택",
    yearPickerConfirmAction: CommonActionCopy.apply,
    yearPickerNote: "선택한 연월일이 달력에 바로 반영돼요.",
  },
} as const);

export const CalendarPickerLayout = {
  yearIndicatorSize: 8,
  yearIndicatorTopInset: 1,
} as const;
