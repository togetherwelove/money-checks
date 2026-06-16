import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppColors } from "../constants/colors";
import { FooterActionPopoverUi, FooterTabBarMetrics, FooterTabBarUi } from "../constants/menu";
import type { FooterTabItem, FooterTabScreen } from "../lib/footerTabs";
import { FooterActionPopover, type FooterActionPopoverAction } from "./FooterActionPopover";

type AppFooterTabBarProps = {
  activeScreen: FooterTabScreen | null;
  badgedScreens?: readonly FooterTabScreen[];
  isPrimaryActionMenuOpen?: boolean;
  isPrimaryActionDisabled?: boolean;
  onDismissPrimaryActionMenu?: () => void;
  onSelectTab: (targetScreen: FooterTabScreen) => void;
  primaryActionMenuActions?: FooterActionPopoverAction[];
  tabs: FooterTabItem[];
};

export function AppFooterTabBar({
  activeScreen,
  badgedScreens = [],
  isPrimaryActionMenuOpen = false,
  isPrimaryActionDisabled = false,
  onDismissPrimaryActionMenu,
  onSelectTab,
  primaryActionMenuActions = [],
  tabs,
}: AppFooterTabBarProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const hasPrimaryActionMenu =
    primaryActionMenuActions.length > 0 && Boolean(onDismissPrimaryActionMenu);
  const shouldShowPrimaryActionMenu = hasPrimaryActionMenu && onDismissPrimaryActionMenu;

  return (
    <>
      {shouldShowPrimaryActionMenu ? (
        <FooterActionPopover
          actions={primaryActionMenuActions}
          bottomOffset={
            safeAreaInsets.bottom + FooterTabBarMetrics.height + FooterActionPopoverUi.bottomOffset
          }
          onDismiss={shouldShowPrimaryActionMenu}
          visible={isPrimaryActionMenuOpen}
        />
      ) : null}
      <View style={styles.root}>
        {tabs.map((tab) => {
          const isActive = tab.targetScreen === activeScreen;
          const hasBadge = badgedScreens.includes(tab.targetScreen);
          const isDisabledPrimaryAction = Boolean(tab.isPrimary && isPrimaryActionDisabled);
          return (
            <Pressable
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={tab.targetScreen}
              onPress={() => onSelectTab(tab.targetScreen)}
              style={styles.tab}
            >
              <View
                style={[
                  styles.iconButton,
                  tab.isPrimary ? styles.primaryIconButton : null,
                  isDisabledPrimaryAction ? styles.disabledPrimaryIconButton : null,
                ]}
              >
                <MaterialCommunityIcons
                  color={resolveIconColor(tab, isActive, isDisabledPrimaryAction)}
                  name={resolveTabIcon(tab, isActive)}
                  size={FooterTabBarUi.iconSize}
                />
                {hasBadge ? <View style={styles.badgeDot} /> : null}
              </View>
              {tab.isPrimary ? null : (
                <Text
                  numberOfLines={1}
                  style={[styles.tabLabel, isActive ? styles.activeTabLabel : null]}
                >
                  {tab.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function resolveTabIcon(tab: FooterTabItem, isActive: boolean) {
  if (tab.isPrimary) {
    return tab.icon;
  }

  return isActive ? tab.activeIcon : tab.inactiveIcon;
}

function resolveIconColor(
  tab: FooterTabItem,
  isActive: boolean,
  isDisabledPrimaryAction: boolean,
): string {
  if (isDisabledPrimaryAction) {
    return AppColors.mutedStrongText;
  }

  if (tab.isPrimary) {
    return AppColors.inverseText;
  }

  return isActive ? AppColors.primary : AppColors.mutedText;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: FooterTabBarUi.tabGap,
    paddingHorizontal: FooterTabBarUi.barPaddingHorizontal,
    borderTopWidth: FooterTabBarUi.borderTopWidth,
    borderTopColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: FooterTabBarUi.labelGap,
    paddingVertical: FooterTabBarUi.tabPaddingVertical,
  },
  iconButton: {
    width: FooterTabBarUi.iconButtonSize,
    height: FooterTabBarUi.iconButtonSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: FooterTabBarUi.iconButtonSize / 2,
  },
  primaryIconButton: {
    width: FooterTabBarUi.primaryIconButtonSize,
    height: FooterTabBarUi.primaryIconButtonSize,
    borderRadius: FooterTabBarUi.primaryIconButtonSize / 2,
    backgroundColor: AppColors.primary,
  },
  disabledPrimaryIconButton: {
    backgroundColor: AppColors.surfaceStrong,
    opacity: 0.72,
  },
  badgeDot: {
    position: "absolute",
    top: FooterTabBarUi.badgeDotOffset,
    right: FooterTabBarUi.badgeDotOffset,
    width: FooterTabBarUi.badgeDotSize,
    height: FooterTabBarUi.badgeDotSize,
    borderRadius: FooterTabBarUi.badgeDotSize / 2,
    borderWidth: FooterTabBarUi.badgeDotBorderWidth,
    borderColor: AppColors.surface,
    backgroundColor: AppColors.expense,
  },
  tabLabel: {
    color: AppColors.mutedText,
    fontSize: FooterTabBarUi.labelFontSize,
    fontWeight: "700",
    lineHeight: FooterTabBarUi.labelLineHeight,
    maxWidth: "100%",
  },
  activeTabLabel: {
    color: AppColors.primary,
  },
});
