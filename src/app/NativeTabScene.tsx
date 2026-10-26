import { useIsFocused } from "@react-navigation/native";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";

// Measure the tab controller's actual safe area without shrinking the content
// that remains visible behind its translucent bar.
export function NativeTabScene({ children, onBottomInsetChange }: {
  children: ReactNode;
  onBottomInsetChange: (inset: number) => void;
}) {
  const focused = useIsFocused();
  const [height, setHeight] = useState(0);
  const [safeHeight, setSafeHeight] = useState(0);
  useLayoutEffect(() => {
    if (focused && height > 0 && safeHeight > 0 && safeHeight <= height) {
      onBottomInsetChange(height - safeHeight);
    }
  }, [focused, height, safeHeight, onBottomInsetChange]);
  return <View style={styles.fill} onLayout={event => setHeight(event.nativeEvent.layout.height)}>
    {children}
    <SafeAreaView pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      edges={{ bottom: true }} insetType="all" style={StyleSheet.absoluteFill}>
      <View style={styles.fill} onLayout={event => setSafeHeight(event.nativeEvent.layout.height)} />
    </SafeAreaView>
  </View>;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
