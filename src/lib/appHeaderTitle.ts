import type { LedgerAppScreen } from "../types/app";
import { getAppScreenLabel } from "./appScreenLabels";

export function getAppHeaderTitle(activeScreen: LedgerAppScreen): string | null {
  return activeScreen === "calendar" ? null : getAppScreenLabel(activeScreen);
}

export function showsCalendarReturnAction(activeScreen: LedgerAppScreen): boolean {
  return activeScreen !== "calendar";
}
