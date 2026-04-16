import { AllEntriesCopy } from "../constants/allEntries";
import { AppMessages } from "../constants/messages";
import { SupportContactCopy } from "../constants/supportContact";
import { NotificationUiCopy } from "../notifications/config/notificationCopy";
import type { LedgerAppScreen } from "../types/app";

export function getAppHeaderTitle(activeScreen: LedgerAppScreen): string | null {
  switch (activeScreen) {
    case "account":
      return AppMessages.accountTitle;
    case "all-entries":
      return AllEntriesCopy.screenTitle;
    case "charts":
      return AppMessages.chartScreenTitle;
    case "contact-support":
      return SupportContactCopy.screenTitle;
    case "entry":
      return AppMessages.entryScreenTitle;
    case "notification-settings":
      return NotificationUiCopy.screenTitle;
    case "share":
      return AppMessages.shareTitle;
    default:
      return null;
  }
}

export function showsCalendarReturnAction(activeScreen: LedgerAppScreen): boolean {
  return activeScreen !== "calendar";
}
