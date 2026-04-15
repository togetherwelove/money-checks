import { forwardRef } from "react";
import type { PropsWithChildren } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import type { ScrollView as ScrollViewType } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { KeyboardLayout } from "../constants/keyboard";

type KeyboardAwareScrollViewProps = PropsWithChildren<{
  centerContent?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export const KeyboardAwareScrollView = forwardRef<ScrollViewType, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(
    { centerContent = false, children, contentContainerStyle, scrollEnabled = true, style },
    ref,
  ) {
    return (
      <ScrollView
        ref={ref}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          centerContent && styles.centerContent,
          contentContainerStyle,
        ]}
        keyboardDismissMode={
          Platform.OS === "ios"
            ? KeyboardLayout.dismissMode.ios
            : KeyboardLayout.dismissMode.android
        }
        keyboardShouldPersistTaps={KeyboardLayout.persistTaps}
        scrollEnabled={scrollEnabled}
        style={[styles.scroll, style]}
      >
        {children}
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: KeyboardLayout.bottomInset,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
