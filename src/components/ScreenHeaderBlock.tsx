import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getAppColors } from "../constants/colors";
import { AppTextBreakProps } from "../constants/textLayout";
import { getScreenTitleTextStyle } from "../constants/uiStyles";

type ScreenHeaderBlockProps = {
  action?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

export function ScreenHeaderBlock({ action, eyebrow, subtitle, title }: ScreenHeaderBlockProps) {
  const styles = getStyles();
  useAppTheme();
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

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    header: {
      gap: 4,
      paddingTop: 8,
    },
    eyebrow: {
      color: getAppColors().mutedStrongText,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    title: {
      ...getScreenTitleTextStyle(),
      flex: 1,
    },
    action: {
      flexShrink: 0,
    },
    subtitle: {
      color: getAppColors().mutedText,
      fontSize: 13,
      lineHeight: 18,
    },
  }),
);
