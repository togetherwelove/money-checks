import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { getAppColors } from "../constants/colors";

export function BlockingOverlay() {
  const styles = getStyles();
  useAppTheme();
  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <ActivityIndicator color={getAppColors().primary} size="large" />
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: getAppColors().overlay,
    },
  }),
);
