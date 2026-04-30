import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { SubscriptionMessages } from "../constants/subscription";
import { SubscriptionPlusLabels } from "../constants/subscriptionPlusLabels";
import { BrandPlusTextStyle } from "../constants/uiStyles";

import { IconActionButton } from "./IconActionButton";

type AppHeaderProps = {
  isMenuOpen?: boolean;
  leadingAction?: ReactNode;
  onOpenMenu: () => void;
  showsPlusBadge?: boolean;
  trailingAction?: ReactNode;
  titleLabel?: string | null;
  yearLabel?: string | null;
};

export function AppHeader({
  isMenuOpen = false,
  leadingAction = null,
  onOpenMenu,
  showsPlusBadge = false,
  trailingAction = null,
  titleLabel = null,
  yearLabel = null,
}: AppHeaderProps) {
  const centerLabel = yearLabel ?? titleLabel;

  return (
    <View style={styles.container}>
      <View style={styles.sideSlot}>{leadingAction}</View>
      <View style={styles.titleSlot}>
        {centerLabel ? (
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
              </>
            )}
          </View>
        ) : null}
      </View>
      <View style={[styles.sideSlot, styles.trailingSlot]}>
        {trailingAction}
        <IconActionButton icon="menu" isActive={isMenuOpen} onPress={onOpenMenu} />
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
