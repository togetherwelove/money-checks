import { Linking } from "react-native";

import {
  SubscriptionManagementConfig,
  SubscriptionManagementMessages,
} from "../../constants/subscriptionManagement";
import { appPlatform } from "../appPlatform";

function getSubscriptionManagementUrl(): string {
  if (appPlatform.isAndroid) {
    return `https://play.google.com/store/account/subscriptions?package=${SubscriptionManagementConfig.androidPackageName}`;
  }

  return SubscriptionManagementConfig.iosManageUrl;
}

export async function openSubscriptionManagement(): Promise<void> {
  const nextUrl = getSubscriptionManagementUrl();
  const canOpenUrl = await Linking.canOpenURL(nextUrl);

  if (!canOpenUrl) {
    throw new Error(SubscriptionManagementMessages.actionLabel);
  }

  await Linking.openURL(nextUrl);
}
