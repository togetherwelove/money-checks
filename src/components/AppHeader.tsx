import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "react-native";

import { AppColors } from "../constants/colors";
import { SubscriptionMessages } from "../constants/subscription";
import { SubscriptionPlusLabels } from "../constants/subscriptionPlusLabels";
import { BrandPlusTextStyle } from "../constants/uiStyles";

import { IconActionButton } from "./IconActionButton";

type AppHeaderProps = {
  canSwitchTitle?: boolean;
  isMenuOpen?: boolean;
  onOpenMenu: () => void;
  onPressTitle?: () => void;
  showsPlusBadge?: boolean;
  titleLabel?: string | null;
  yearLabel?: string | null;
};

export function AppHeader({
  canSwitchTitle = false,
  isMenuOpen = false,
  onOpenMenu,
  onPressTitle,
  showsPlusBadge = false,
  titleLabel = null,
  yearLabel = null,
}: AppHeaderProps) {
  const centerLabel = yearLabel ?? titleLabel;
  const canPressTitle = Boolean(centerLabel && canSwitchTitle && onPressTitle);
  const titleContent = centerLabel ? (
    <View style={styles.titleRow}>
      {centerLabel === SubscriptionMessages.screenTitle ? (
        <Text style={styles.titleText}>
          {SubscriptionPlusLabels.menuPrefix} <Text style={BrandPlusTextStyle}>plus</Text>
        </Text>
      ) : (
        <>
          <Text numberOfLines={1} style={styles.titleText}>
            {centerLabel}
          </Text>
          {showsPlusBadge ? <Text style={BrandPlusTextStyle}>plus</Text> : null}
          {canSwitchTitle ? (
            <Feather color={AppColors.mutedStrongText} name="chevron-down" size={16} />
          ) : null}
        </>
      )}
    </View>
  ) : null;
  const menuIcon = isMenuOpen ? "x" : "menu";

  return (
    <View style={styles.container}>
      <View style={styles.sideSlot} />
      <View style={styles.titleSlot}>
        {canPressTitle ? (
          <Pressable accessibilityRole="button" onPress={onPressTitle} style={styles.titleButton}>
            {titleContent}
          </Pressable>
        ) : (
          titleContent
        )}
      </View>
      <View style={[styles.sideSlot, styles.trailingSlot]}>
        <IconActionButton icon={menuIcon} isActive={isMenuOpen} onPress={onOpenMenu} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  sideSlot: {
    width: 104,
    justifyContent: "center",
  },
  trailingSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  titleSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleButton: {
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  titleText: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
});
