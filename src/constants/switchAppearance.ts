import { createThemeValue } from "../lib/appTheme";
import { getAppColors } from "./colors";
import { FixedColors } from "./fixedColors";

export const getSwitchAppearance = createThemeValue(() => ({
  thumbColor: FixedColors.white,
  trackColor: { false: getAppColors().switchTrackOff, true: getAppColors().switchTrackOn },
  ios_backgroundColor: getAppColors().switchTrackOff,
}));
