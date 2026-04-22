import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { AppLayout } from "../constants/layout";

type ScreenContentContainerProps = PropsWithChildren<{
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function ScreenContentContainer({
  children,
  maxWidth = AppLayout.screenContentMaxWidth,
  style,
}: ScreenContentContainerProps) {
  return <View style={[styles.container, { maxWidth }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "center",
  },
});
