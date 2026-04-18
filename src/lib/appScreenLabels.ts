import { AllEntriesCopy } from "../constants/allEntries";
import { AppMessages } from "../constants/messages";
import { SubscriptionMessages } from "../constants/subscription";
import { SupportContactCopy } from "../constants/supportContact";
import { NotificationUiCopy } from "../notifications/config/notificationCopy";
import type { LedgerAppScreen } from "../types/app";

export const AppScreenLabels: Record<LedgerAppScreen, string> = {
  account: AppMessages.accountTitle,
  "all-entries": AllEntriesCopy.screenTitle,
  calendar: AppMessages.calendarTab,
  charts: AppMessages.chartScreenTitle,
  "contact-support": SupportContactCopy.screenTitle,
  entry: AppMessages.entryScreenTitle,
  "notification-settings": NotificationUiCopy.screenTitle,
  share: AppMessages.shareTitle,
  subscription: SubscriptionMessages.screenTitle,
};

export function getAppScreenLabel(screen: LedgerAppScreen): string {
  return AppScreenLabels[screen];
}
