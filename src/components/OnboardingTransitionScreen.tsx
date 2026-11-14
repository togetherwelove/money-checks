import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { getAppColors } from "../constants/colors";

export function OnboardingTransitionScreen() {
  const styles = getStyles();
  useAppTheme();
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={getAppColors().primary} size="small" />
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    screen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: getAppColors().screenBackground,
    },
  }),
);
