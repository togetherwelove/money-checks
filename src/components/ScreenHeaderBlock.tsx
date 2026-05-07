import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppTextBreakProps } from "../constants/textLayout";

type ScreenHeaderBlockProps = {
  action?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

export function ScreenHeaderBlock({ action, eyebrow, subtitle, title }: ScreenHeaderBlockProps) {
  return (
    <View style={styles.header}>
      {eyebrow ? (
        <Text {...AppTextBreakProps} style={styles.eyebrow}>
          {eyebrow}
        </Text>
      ) : null}
      <View style={styles.titleRow}>
        <Text {...AppTextBreakProps} style={styles.title}>
          {title}
        </Text>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
      {subtitle ? (
        <Text {...AppTextBreakProps} style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
    paddingTop: 8,
  },
  eyebrow: {
    color: AppColors.mutedStrongText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    color: AppColors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  action: {
    flexShrink: 0,
  },
  subtitle: {
    color: AppColors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
});
