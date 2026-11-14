import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { StyleSheet, Text, View } from "react-native";

import { getAppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { getAppVersionLabel } from "../lib/appVersion";

export function AppVersionFooter() {
  const styles = getStyles();
  useAppTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`Version ${getAppVersionLabel()}`}</Text>
      <Text style={styles.copyright}>Copyright © 2026 알뜰</Text>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      paddingTop: AppLayout.cardGap,
      paddingBottom: AppLayout.cardGap,
      gap: 2,
    },
    title: {
      color: getAppColors().mutedText,
      fontSize: 11,
      fontWeight: "700",
    },
    copyright: {
      color: getAppColors().mutedStrongText,
      fontSize: 11,
      fontWeight: "600",
    },
  }),
);
