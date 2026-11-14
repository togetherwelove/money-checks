import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { MaterialCommunityIcons } from "./AppIcons";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { getAppColors } from "../constants/colors";
import { FooterTabBarUi, resolveFooterTabBarHeight } from "../constants/menu";
import { CompactTextProps } from "../constants/textLayout";
import type { FooterTabItem, FooterTabScreen } from "../lib/footerTabs";

type AppFooterTabBarProps = {
  activeScreen: FooterTabScreen | null;
  badgedScreens?: readonly FooterTabScreen[];
  disabled?: boolean;
  onSelectTab: (screen: FooterTabScreen) => void;
  tabs: FooterTabItem[];
};

export function AppFooterTabBar({
  activeScreen,
  badgedScreens = [],
  disabled = false,
  onSelectTab,
  tabs,
}: AppFooterTabBarProps) {
  const styles = getStyles();
  useAppTheme();
  const { fontScale } = useWindowDimensions();
  return (
    <View style={[styles.root, { minHeight: resolveFooterTabBarHeight(fontScale) }]}>
      {tabs.map((tab) => {
        const isActive = tab.targetScreen === activeScreen;
        return (
          <Pressable
            key={tab.targetScreen}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive, disabled }}
            disabled={disabled}
            onPress={() => {
              if (!disabled) onSelectTab(tab.targetScreen);
            }}
            style={({ pressed }) => [
              styles.tab,
              isActive && styles.activeTab,
              disabled && styles.disabled,
              pressed && styles.pressedTab,
            ]}
          >
            <View style={styles.iconButton}>
              <MaterialCommunityIcons
                name={isActive ? tab.activeIcon : tab.inactiveIcon}
                size={FooterTabBarUi.iconSize}
                color={isActive ? getAppColors().primary : getAppColors().text}
              />
              {badgedScreens.includes(tab.targetScreen) ? <View style={styles.badgeDot} /> : null}
            </View>
            <Text
              {...CompactTextProps}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              numberOfLines={1}
              style={[styles.tabLabel, isActive && styles.activeTabLabel]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    root: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: FooterTabBarUi.tabGap,
      minHeight: FooterTabBarUi.barMinHeight,
      marginBottom: FooterTabBarUi.barBottomInset,
      paddingHorizontal: FooterTabBarUi.barPaddingHorizontal,
      borderWidth: FooterTabBarUi.barBorderWidth,
      borderColor: getAppColors().border,
      borderRadius: FooterTabBarUi.barBorderRadius,
      backgroundColor: getAppColors().capsuleSurface,
      shadowColor: getAppColors().text,
      shadowOffset: {
        width: FooterTabBarUi.barShadowOffsetX,
        height: FooterTabBarUi.barShadowOffsetY,
      },
      shadowOpacity: FooterTabBarUi.barShadowOpacity,
      shadowRadius: FooterTabBarUi.barShadowRadius,
      elevation: FooterTabBarUi.barElevation,
    },
    tab: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent: "center",
      gap: FooterTabBarUi.labelGap,
      paddingHorizontal: FooterTabBarUi.tabPaddingHorizontal,
      paddingVertical: FooterTabBarUi.tabPaddingVertical,
      borderRadius: FooterTabBarUi.activeTabBorderRadius,
    },
    activeTab: {
      backgroundColor: getAppColors().surfaceStrong,
    },
    pressedTab: {
      opacity: FooterTabBarUi.pressedTabOpacity,
    },
    iconButton: {
      width: FooterTabBarUi.iconButtonSize,
      height: FooterTabBarUi.iconButtonSize,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: FooterTabBarUi.iconButtonSize / 2,
    },
    disabled: { opacity: FooterTabBarUi.disabledOpacity },
    badgeDot: {
      position: "absolute",
      top: FooterTabBarUi.badgeDotOffset,
      right: FooterTabBarUi.badgeDotOffset,
      width: FooterTabBarUi.badgeDotSize,
      height: FooterTabBarUi.badgeDotSize,
      borderRadius: FooterTabBarUi.badgeDotSize / 2,
      backgroundColor: getAppColors().expense,
    },
    tabLabel: {
      color: getAppColors().text,
      fontSize: FooterTabBarUi.labelFontSize,
      fontWeight: "700",
      lineHeight: FooterTabBarUi.labelLineHeight,
      maxWidth: "100%",
    },
    activeTabLabel: {
      color: getAppColors().primary,
    },
  }),
);
