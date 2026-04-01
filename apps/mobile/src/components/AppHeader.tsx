import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppMessages } from "../constants/messages";
import type { LedgerAppScreen } from "../types/app";
import { IconActionButton } from "./IconActionButton";

type AppHeaderProps = {
  activeScreen: LedgerAppScreen;
  onOpenMenu: () => void;
};

export function AppHeader({ activeScreen, onOpenMenu }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.titleOverlay}>
        <Text style={styles.titleText}>{AppMessages.brand}</Text>
      </View>
      <IconActionButton icon="menu" isActive={activeScreen === "menu"} onPress={onOpenMenu} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    minHeight: 50,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  titleOverlay: {
    position: "absolute",
    left: 8,
    right: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
});
