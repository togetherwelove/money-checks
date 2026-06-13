import { Linking } from "react-native";

function getSubscriptionManagementUrl(): string {
  return "https://apps.apple.com/account/subscriptions";
}

export async function openSubscriptionManagement(): Promise<void> {
  const nextUrl = getSubscriptionManagementUrl();
  const canOpenUrl = await Linking.canOpenURL(nextUrl);

  if (!canOpenUrl) {
    throw new Error("구독 관리 화면을 열지 못했어요.");
  }

  await Linking.openURL(nextUrl);
}
