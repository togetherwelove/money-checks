import { StyleSheet, Text, View } from "react-native";

import { AdTrackingCopy, AdTrackingUi } from "../../constants/adTracking";
import { AppColors } from "../../constants/colors";
import { AppTextBreakProps } from "../../constants/textLayout";
import {
  CardTitleTextStyle,
  SupportingTextStyle,
  SurfaceCardStyle,
} from "../../constants/uiStyles";
import type { AdTrackingPermissionState } from "../../lib/ads/trackingTransparency";
import { ActionButton } from "../ActionButton";

type AdTrackingPermissionCardProps = {
  onOpenSettings: () => void;
  onRequestPermission: () => void;
  permissionState: AdTrackingPermissionState;
};

export function AdTrackingPermissionCard({
  onOpenSettings,
  onRequestPermission,
  permissionState,
}: AdTrackingPermissionCardProps) {
  const action =
    permissionState === "not-determined" ? (
      <ActionButton
        label={AdTrackingCopy.actionRequest}
        onPress={onRequestPermission}
        size="inline"
        variant="primary"
      />
    ) : permissionState === "denied" ? (
      <ActionButton
        label={AdTrackingCopy.actionOpenSettings}
        onPress={onOpenSettings}
        size="inline"
        variant="secondary"
      />
    ) : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{AdTrackingCopy.title}</Text>
      <Text {...AppTextBreakProps} style={styles.description}>
        {AdTrackingCopy.description}
      </Text>
      <View style={styles.actionRow}>
        <Text style={styles.status}>{resolveAdTrackingStatusLabel(permissionState)}</Text>
        {action}
      </View>
    </View>
  );
}

function resolveAdTrackingStatusLabel(permissionState: AdTrackingPermissionState): string {
  if (permissionState === "authorized") {
    return AdTrackingCopy.statusAuthorized;
  }

  if (permissionState === "not-determined") {
    return AdTrackingCopy.statusNotDetermined;
  }

  if (permissionState === "unavailable") {
    return AdTrackingCopy.statusUnavailable;
  }

  return AdTrackingCopy.statusDenied;
}

const styles = StyleSheet.create({
  card: {
    ...SurfaceCardStyle,
    gap: AdTrackingUi.rowGap,
  },
  title: CardTitleTextStyle,
  description: {
    ...SupportingTextStyle,
    fontSize: AdTrackingUi.descriptionTextSize,
    lineHeight: AdTrackingUi.descriptionLineHeight,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: AdTrackingUi.actionRowGap,
  },
  status: {
    color: AppColors.text,
    flexShrink: 1,
    fontSize: AdTrackingUi.statusFontSize,
    fontWeight: "700",
  },
});
