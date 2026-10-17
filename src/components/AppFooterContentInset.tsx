import { useContext } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { BottomContentInsetContext } from "../contexts/BottomContentInsetContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FooterTabBarUi, resolveFooterTabBarHeight } from "../constants/menu";

export function AppFooterContentInset() {
  const safeAreaInsets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const contentInset = useContext(BottomContentInsetContext);
  const height =
    contentInset ?? (safeAreaInsets.bottom +
    FooterTabBarUi.barBottomInset +
    resolveFooterTabBarHeight(fontScale) +
    FooterTabBarUi.contentBottomGap);

  return <View pointerEvents="none" style={[styles.inset, { height }]} />;
}

const styles = StyleSheet.create({
  inset: {
    flexShrink: 0,
  },
});
