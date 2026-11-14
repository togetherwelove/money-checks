import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { getAppColors } from "../constants/colors";
import { createThemeValue, getAppColorScheme } from "./appTheme";

export const getAppNavigationTheme = createThemeValue(() => {
  const base = getAppColorScheme() === "dark" ? DarkTheme : DefaultTheme;
  const colors = getAppColors();
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.screenBackground,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.expense,
    },
  };
});
