import type { TFunction } from "i18next";

import { AllEntriesCopy } from "../constants/allEntries";
import { HelpCopy } from "../constants/help";
import { AppMessages } from "../constants/messages";
import { SubscriptionMessages } from "../constants/subscription";
import { SupportMessages } from "../constants/support";
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

const AppScreenLabelKeys: Record<LedgerAppScreen, string> = {
  account: "screens.account",
  "all-entries": "screens.allEntries",
  calendar: "screens.calendar",
  charts: "screens.charts",
  "contact-support": "screens.contactSupport",
  entry: "screens.entry",
  help: "screens.help",
  "notification-settings": "screens.notificationSettings",
  share: "screens.share",
  support: "screens.support",
  subscription: "screens.subscription",
};

export function getAppScreenLabel(screen: LedgerAppScreen, t?: TFunction): string {
  if (t) {
    return t(AppScreenLabelKeys[screen]);
  }

  return AppScreenLabels[screen];
}
