import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import type { LedgerAppScreen } from "../types/app";

type ScreenTabsProps = {
  activeScreen: LedgerAppScreen;
  onChangeScreen: (screen: LedgerAppScreen) => void;
};

const SCREEN_TABS: LedgerAppScreen[] = ["calendar", "entry"];

export function ScreenTabs({ activeScreen, onChangeScreen }: ScreenTabsProps) {
  return (
    <View style={styles.container}>
      {SCREEN_TABS.map((screen) => (
        <Pressable
          key={screen}
          onPress={() => onChangeScreen(screen)}
          style={[styles.tab, activeScreen === screen && styles.activeTab]}
        >
          <Text style={[styles.label, activeScreen === screen && styles.activeLabel]}>
            {screen === "calendar" ? AppMessages.calendarTab : AppMessages.entryTab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  activeTab: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  label: {
    color: AppColors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  activeLabel: {
    color: AppColors.primary,
    fontWeight: "700",
  },
});
