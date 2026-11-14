import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getAppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { getSupportingTextStyle } from "../constants/uiStyles";

export function ScreenLoadingOverlay() {
  const styles = getStyles();
  useAppTheme();
  return (
    <View
      style={styles.overlay}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator color={getAppColors().primary} />
      <Text style={getSupportingTextStyle()}>{AppMessages.ledgerLoading}</Text>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: getAppColors().screenBackground,
      alignItems: "center",
      justifyContent: "center",
      gap: AppLayout.cardGap,
    },
  }),
);
