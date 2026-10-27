import { useState, type ComponentProps } from "react";
import { Animated, StyleSheet, type ViewProps } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { ClipboardPromptUi as Ui } from "../constants/cardSmsClipboard";
import { FloatingEntryButtonUi } from "../constants/menu";
import { useClipboardExpansionAnimation } from "../hooks/useClipboardExpansionAnimation";
import { ClipboardEntrySuggestion } from "./entryComposer/ClipboardEntrySuggestion";

type Props = ComponentProps<typeof ClipboardEntrySuggestion> & {
  bottomInset: number;
  onLayout?: ViewProps["onLayout"];
};

export function ClipboardSuggestionBanner({ bottomInset, onLayout, ...props }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useClipboardExpansionAnimation(size.width > 0 && size.height > 0);
  return <Animated.View accessibilityLiveRegion="polite" onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    setSize(current => current.width === width && current.height === height ? current : { width, height });
    onLayout?.(event);
  }} style={[styles.banner, {
    bottom: bottomInset + FloatingEntryButtonUi.footerGap,
    opacity: progress.interpolate({ inputRange: [0, Ui.revealProgress, 1], outputRange: [0, 1, 1] }),
    transformOrigin: [size.width, size.height, 0],
    transform: [
      { scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [size.width > 0 ? FloatingEntryButtonUi.size / size.width : 1, 1] }) },
      { scaleY: progress.interpolate({ inputRange: [0, 1], outputRange: [size.height > 0 ? FloatingEntryButtonUi.size / size.height : 1, 1] }) },
    ],
  }]}>
    <ClipboardEntrySuggestion {...props} />
  </Animated.View>;
}

const styles = StyleSheet.create({
  banner: { position: "absolute", left: FloatingEntryButtonUi.rightInset, right: FloatingEntryButtonUi.rightInset,
    padding: AppLayout.cardContentPadding, borderRadius: Ui.cornerRadius,
    borderWidth: AppLayout.dividerWidth, borderColor: AppColors.border, backgroundColor: AppColors.surface },
});
