import { AppColors } from "./colors";

export const CalendarDayUi = {
  heatmapBackgroundColors: {
    expense: [
      "rgba(184, 84, 60, 0.1)",
      "rgba(184, 84, 60, 0.19)",
      "rgba(184, 84, 60, 0.3)",
      "rgba(184, 84, 60, 0.43)",
      "rgba(184, 84, 60, 0.58)",
    ],
    income: [
      "rgba(29, 122, 99, 0.08)",
      "rgba(29, 122, 99, 0.14)",
      "rgba(29, 122, 99, 0.21)",
      "rgba(29, 122, 99, 0.29)",
      "rgba(29, 122, 99, 0.37)",
    ],
  },
  heatmapLevelThresholds: [0.2, 0.4, 0.6, 0.8],
  saturdayTextColor: AppColors.mutedStrongText,
  sundayTextColor: AppColors.mutedStrongText,
  weekendTextOpacity: 0.72,
  readOnlyDayOpacity: 0.72,
  amountFontSize: 9,
  amountLineHeight: 11,
  amountMinimumScale: 0.55,
} as const;
