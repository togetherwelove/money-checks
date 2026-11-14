import { useSyncExternalStore } from "react";
import { getAppColorScheme, getThemeSnapshot, subscribeAppTheme } from "../lib/appTheme";

export function useAppTheme() {
  useSyncExternalStore(subscribeAppTheme, getThemeSnapshot, getThemeSnapshot);
  return getAppColorScheme();
}
