import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { StyleSheet, Text, View } from "react-native";

import { getMenuStyles } from "../../constants/menuStyles";

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
  const styles = getStyles();
  useAppTheme();
  const action =
    permissionState === "not-determined" ? (
      <ActionButton
        label="추적 허용"
        onPress={onRequestPermission}
        size="inline"
        variant="primary"
      />
    ) : permissionState === "denied" ? (
      <ActionButton label="설정 열기" onPress={onOpenSettings} size="inline" variant="secondary" />
    ) : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>앱 추적 권한 허용하기</Text>
      <View style={styles.actionRow}>
        <Text style={styles.status}>{resolveAdTrackingStatusLabel(permissionState)}</Text>
        {action}
      </View>
    </View>
  );
}

function resolveAdTrackingStatusLabel(permissionState: AdTrackingPermissionState): string {
  if (permissionState === "authorized") {
    return "허용됨";
  }

  if (permissionState === "not-determined") {
    return "요청 전";
  }

  if (permissionState === "unavailable") {
    return "사용 불가";
  }

  return "허용 안 됨";
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    card: getMenuStyles().panel,
    title: getMenuStyles().sectionTitle,
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: getMenuStyles().section.gap,
    },
    status: { ...getMenuStyles().title, flexShrink: 1 },
  }),
);
