import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../../constants/colors";
import { AppLayout } from "../../constants/layout";
import { getAppVersionLabel } from "../../lib/appVersion";

export function AccountVersionFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`Version ${getAppVersionLabel()}`}</Text>
      <Text style={styles.copyright}>Copyright © 2026 알뜰</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: AppLayout.cardGap,
    paddingBottom: AppLayout.cardGap,
    gap: 2,
  },
  title: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
  copyright: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "600",
  },
});
