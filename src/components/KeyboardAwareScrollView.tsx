import { forwardRef } from "react";
import type { ComponentRef, PropsWithChildren, ReactElement } from "react";
import { Platform, StyleSheet } from "react-native";
import type { RefreshControlProps } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { KeyboardAwareScrollView as NativeKeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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
  ComponentRef<typeof NativeKeyboardAwareScrollView>,
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
    <NativeKeyboardAwareScrollView
      ref={ref}
      enableAutomaticScroll
      enableOnAndroid
      contentContainerStyle={[
        styles.content,
        centerContent && styles.centerContent,
        contentContainerStyle,
      ]}
      extraScrollHeight={extraScrollHeight}
      keyboardDismissMode={
        Platform.OS === "ios" ? KeyboardLayout.dismissMode.ios : KeyboardLayout.dismissMode.android
      }
      keyboardShouldPersistTaps={KeyboardLayout.persistTaps}
      refreshControl={refreshControl}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={[fillAvailableHeight ? styles.scroll : null, style]}
    >
      {children}
    </NativeKeyboardAwareScrollView>
  );
});

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
