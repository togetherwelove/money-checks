import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { getMenuStyles } from "../constants/menuStyles";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { HelpFaqSection } from "../components/HelpFaqSection";
import { getAppColors } from "../constants/colors";
import { AppScrollBehavior } from "../constants/scroll";

export function HelpFaqScreen({ screenTitle }: { screenTitle: ReactNode }) {
  const styles = getStyles();
  useAppTheme();
  return (
    <ScrollView
      {...AppScrollBehavior}
      removeClippedSubviews={false}
      contentContainerStyle={styles.content}
      style={styles.screen}
    >
      {screenTitle}
      <HelpFaqSection />
      <AppFooterContentInset />
    </ScrollView>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: getAppColors().screenBackground },
    content: {
      ...getMenuStyles().content,
    },
  }),
);
