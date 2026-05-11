import { selectStaticCopy } from "../i18n/staticCopy";
import { CommonActionCopy } from "./commonActions";

export const DateMemoCopy = selectStaticCopy({
  en: {
    title: "Date Memo",
    placeholder: "Write a memo visible only on the selected date",
    deleteAction: "Delete",
    editAction: "Edit",
    helperText: "This memo is visible only on the selected date in the calendar.",
    toggleAccessibilityLabel: "Expand date memo",
  },
  ko: {
    title: "날짜 메모",
    placeholder: "날짜에 메모를 적어보세요.",
    deleteAction: "삭제",
    editAction: "편집",
    helperText: "날짜 메모입니다.",
    toggleAccessibilityLabel: "날짜 메모 펼치기",
  },
} as const);

export const DateMemoUi = {
  accordionMaxHeight: 192,
  accordionMinHeight: 96,
  calendarIndicatorOffsetRight: -4,
  calendarIndicatorOffsetTop: 0,
  calendarIndicatorSize: 4,
  inputMaxLength: 300,
  keyboardExtraScrollHeightMax: 96,
  keyboardExtraScrollHeightMin: 24,
  keyboardExtraScrollHeightRatio: 0.5,
  panelBorderRadius: 14,
  panelGap: 8,
  panelPadding: 12,
  previewMaxLines: 6,
  toggleIconSize: 18,
  activeIconName: "note-edit",
  inactiveIconName: "note-edit-outline",
  saveAction: CommonActionCopy.save,
} as const;
