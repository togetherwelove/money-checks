import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { StyleSheet, Text, View } from "react-native";

import { StartupCopy } from "../constants/startup";
import { AppLayout } from "../constants/layout";
import {
  getCardTitleTextStyle,
  getPageSectionStyle,
  getSupportingTextStyle,
} from "../constants/uiStyles";
import { ActionButton } from "./ActionButton";

export function StartupErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const styles = getStyles();
  useAppTheme();
  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={getCardTitleTextStyle()}>
        {StartupCopy.title}
      </Text>
      <Text accessibilityRole="alert" style={getSupportingTextStyle()}>
        {message}
      </Text>
      <ActionButton label={StartupCopy.retry} onPress={onRetry} variant="primary" />
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    screen: {
      ...getPageSectionStyle(),
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: AppLayout.compactGap,
    },
  }),
);
