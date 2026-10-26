import { StyleSheet, Text, View } from "react-native";

import { StartupCopy } from "../constants/startup";
import { AppLayout } from "../constants/layout";
import { CardTitleTextStyle, PageSectionStyle, SupportingTextStyle } from "../constants/uiStyles";
import { ActionButton } from "./ActionButton";

export function StartupErrorScreen({ message, onRetry }: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={CardTitleTextStyle}>{StartupCopy.title}</Text>
      <Text accessibilityRole="alert" style={SupportingTextStyle}>{message}</Text>
      <ActionButton label={StartupCopy.retry} onPress={onRetry} variant="primary" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...PageSectionStyle,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: AppLayout.compactGap,
  },
});
