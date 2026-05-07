import { ICON_ACTION_BUTTON_COMPACT_SIZE } from "../components/IconActionButton";
import { selectStaticCopy } from "../i18n/staticCopy";

export const DateNavigationToolbarLayout = {
  compactBottomPadding: 2,
  defaultBottomPadding: 8,
  defaultMinHeight: ICON_ACTION_BUTTON_COMPACT_SIZE,
  defaultTopPadding: 8,
  indicatorSize: 4,
  indicatorTopMargin: 1,
  labelGap: 6,
} as const;

export const DateNavigationToolbarCopy = selectStaticCopy({
  en: {
    moveToTodayAccessibilityLabel: "Go to today",
    nextMonthAccessibilityLabel: "Go to next month",
    previousMonthAccessibilityLabel: "Go to previous month",
  },
  ko: {
    moveToTodayAccessibilityLabel: "오늘 날짜로 이동",
    nextMonthAccessibilityLabel: "다음 달로 이동",
    previousMonthAccessibilityLabel: "이전 달로 이동",
  },
} as const);
