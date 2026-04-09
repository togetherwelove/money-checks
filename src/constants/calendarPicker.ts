import { CommonActionCopy } from "./commonActions";

export const CalendarPickerCopy = {
  closeAction: CommonActionCopy.close,
  yearPickerTitle: "날짜 선택",
  yearPickerConfirmAction: CommonActionCopy.apply,
  yearPickerNote: "선택한 연월일이 달력에 바로 반영됩니다.",
} as const;

export const CalendarPickerLayout = {
  yearIndicatorSize: 8,
  yearIndicatorTopInset: 1,
} as const;
