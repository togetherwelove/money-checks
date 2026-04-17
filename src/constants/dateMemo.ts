import { CommonActionCopy } from "./commonActions";

export const DateMemoCopy = {
  title: "날짜 메모",
  placeholder: "이 날짜에 남길 메모를 적어보세요.",
  deleteAction: "삭제",
  helperText: "달력에서 선택한 날짜에만 보이는 메모입니다.",
  toggleAccessibilityLabel: "날짜 메모 펼치기",
} as const;

export const DateMemoUi = {
  accordionMinHeight: 96,
  calendarIndicatorInset: 6,
  calendarIndicatorSize: 8,
  inputMaxLength: 300,
  keyboardExtraScrollHeight: 72,
  panelBorderRadius: 14,
  panelGap: 8,
  panelPadding: 12,
  toggleIconSize: 18,
  activeIconName: "note-text",
  inactiveIconName: "note-text-outline",
  saveAction: CommonActionCopy.save,
} as const;
