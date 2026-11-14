import { createThemeValue } from "../lib/appTheme";
import { getAppColors } from "./colors";

export const getToastUi = createThemeValue(
  () =>
    ({
      backgroundColor: getAppColors().text,
      bottomOffset: 56,
      durationMs: 2000,
      opacity: 0.96,
      textColor: getAppColors().onInverseSurface,
      textSize: 13,
    }) as const,
);
