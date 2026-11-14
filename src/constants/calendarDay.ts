import { createThemeValue } from "../lib/appTheme";
import { getAppHeatmapColors, getAppColors } from "./colors";

export const getCalendarDayUi = createThemeValue(
  () =>
    ({
      heatmapBackgroundColors: getAppHeatmapColors(),
      heatmapLevelThresholds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
      saturdayTextColor: getAppColors().mutedStrongText,
      sundayTextColor: getAppColors().mutedStrongText,
      weekendTextOpacity: 0.72,
      readOnlyDayOpacity: 0.72,
      dayNumberFontSize: 15,
      weekdayFontSize: 12,
      weekdayPaddingVertical: 8,
      amountFontSize: 9,
      amountLineHeight: 11,
      amountMinimumScale: 0.55,
    }) as const,
);
