import type { ComponentProps } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { ClipboardEntrySuggestion } from "./entryComposer/ClipboardEntrySuggestion";

type Props = ComponentProps<typeof ClipboardEntrySuggestion> & {
  bottomInset: number;
  onLayout?: ViewProps["onLayout"];
};

export function ClipboardSuggestionBanner({ bottomInset, onLayout, ...props }: Props) {
  return <View onLayout={onLayout} style={[styles.banner, { bottom: bottomInset + AppLayout.compactGap }]}>
    <ClipboardEntrySuggestion {...props} />
  </View>;
}

const styles = StyleSheet.create({
  banner: { position: "absolute", left: AppLayout.screenPadding, right: AppLayout.screenPadding,
    padding: AppLayout.cardContentPadding, borderRadius: AppLayout.cardRadius,
    borderWidth: AppLayout.dividerWidth, borderColor: AppColors.border, backgroundColor: AppColors.surface },
});
