import { AllEntriesCopy } from "../constants/allEntries";
import { HelpCopy } from "../constants/help";
import { AppMessages } from "../constants/messages";
import { SupportMessages } from "../constants/support";
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
  help: HelpCopy.screenTitle,
  "notification-settings": NotificationUiCopy.screenTitle,
  share: AppMessages.shareTitle,
  support: SupportMessages.screenTitle,
  subscription: SubscriptionMessages.screenTitle,
};

export function getAppScreenLabel(screen: LedgerAppScreen): string {
  return AppScreenLabels[screen];
}
