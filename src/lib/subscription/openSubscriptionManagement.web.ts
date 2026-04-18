import {
  SubscriptionManagementConfig,
} from "../../constants/subscriptionManagement";

export async function openSubscriptionManagement(): Promise<void> {
  window.open(SubscriptionManagementConfig.iosManageUrl, "_blank", "noopener,noreferrer");
}
