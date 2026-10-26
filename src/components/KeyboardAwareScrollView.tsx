import { AppScrollBehavior } from "../constants/scroll";
import { forwardRef } from "react";
import type { PropsWithChildren, ReactElement } from "react";
import { ScrollView, StyleSheet } from "react-native";
import type { RefreshControlProps } from "react-native";
import type { ScrollViewInstance, StyleProp, ViewStyle } from "react-native";

import { KeyboardLayout } from "../constants/keyboard";

type KeyboardAwareScrollViewProps = PropsWithChildren<{
  centerContent?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraScrollHeight?: number;
  fillAvailableHeight?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  scrollEnabled?: boolean;
  showsVerticalScrollIndicator?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export const KeyboardAwareScrollView = forwardRef<
  ScrollViewInstance,
  KeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(
  {
    centerContent = false,
    children,
    contentContainerStyle,
    extraScrollHeight = 0,
    fillAvailableHeight = true,
    refreshControl,
    scrollEnabled = true,
    showsVerticalScrollIndicator = true,
    style,
  },
  ref,
) {
  return (
    <ScrollView {...AppScrollBehavior}
      ref={ref}
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[centerContent && styles.centerContent, extraScrollHeight > 0 && { paddingBottom: extraScrollHeight }, contentContainerStyle]}
      keyboardDismissMode={KeyboardLayout.dismissMode}
      keyboardShouldPersistTaps={KeyboardLayout.persistTaps}
      refreshControl={refreshControl}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={[fillAvailableHeight ? styles.scroll : null, style]}
    >
      {children}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
