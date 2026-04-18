import type { LedgerAppScreen } from "../types/app";

export function showsCalendarReturnAction(activeScreen: LedgerAppScreen): boolean {
  return activeScreen !== "calendar";
}
