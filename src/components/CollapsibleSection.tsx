import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Animated, type LayoutChangeEvent, StyleSheet, View } from "react-native";

import {
  COLLAPSIBLE_HEIGHT_DURATION_MS,
  COLLAPSIBLE_OPACITY_DURATION_MS,
  COLLAPSIBLE_TRANSLATE_Y,
} from "../constants/animation";

type CollapsibleSectionProps = {
  children: ReactNode;
  isCollapsed: boolean;
};

export function CollapsibleSection({ children, isCollapsed }: CollapsibleSectionProps) {
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const heightValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const translateYValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (contentHeight === null) {
      return;
    }

    Animated.parallel([
      Animated.timing(heightValue, {
        duration: COLLAPSIBLE_HEIGHT_DURATION_MS,
        toValue: isCollapsed ? 0 : contentHeight,
        useNativeDriver: false,
      }),
      Animated.timing(opacityValue, {
        duration: COLLAPSIBLE_OPACITY_DURATION_MS,
        toValue: isCollapsed ? 0 : 1,
        useNativeDriver: false,
      }),
      Animated.timing(translateYValue, {
        duration: COLLAPSIBLE_OPACITY_DURATION_MS,
        toValue: isCollapsed ? -COLLAPSIBLE_TRANSLATE_Y : 0,
        useNativeDriver: false,
      }),
    ]).start();
  }, [contentHeight, heightValue, isCollapsed, opacityValue, translateYValue]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight <= 0 || nextHeight === contentHeight) {
      return;
    }

    setContentHeight(nextHeight);
    if (!isCollapsed) {
      heightValue.setValue(nextHeight);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        contentHeight === null ? null : { height: heightValue },
        {
          opacity: opacityValue,
          transform: [{ translateY: translateYValue }],
        },
      ]}
    >
      <View onLayout={handleLayout} style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    width: "100%",
  },
  content: {
    width: "100%",
  },
});
