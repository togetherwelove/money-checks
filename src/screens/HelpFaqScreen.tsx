import type { ReactNode } from "react";
import { ScrollView,StyleSheet } from "react-native";
import { MenuStyles } from "../constants/menuStyles";

import { AppFooterContentInset } from "../components/AppFooterContentInset";
import { HelpFaqSection } from "../components/HelpFaqSection";
import { AppColors } from "../constants/colors";
import { AppScrollBehavior } from "../constants/scroll";

export function HelpFaqScreen({ screenTitle }: { screenTitle: ReactNode }) {
  return (
    <ScrollView {...AppScrollBehavior} removeClippedSubviews={false}
      contentContainerStyle={styles.content} style={styles.screen}>
      {screenTitle}
      <HelpFaqSection />
      <AppFooterContentInset />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.screenBackground },
  content: {
    ...MenuStyles.content,
  },
});
