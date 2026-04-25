import type { LedgerAppScreen } from "../types/app";

export function showsBackNavigationAction(activeScreen: LedgerAppScreen): boolean {
  return activeScreen !== "calendar";
}
