import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout, AppScreenTitleUi } from "../constants/layout";
import { MenuUi } from "../constants/menu";
import { SubscriptionMessages } from "../constants/subscription";
import { CompactTextProps } from "../constants/textLayout";
import { BrandPlusTextStyle, ScreenTitleTextStyle } from "../constants/uiStyles";

type AppScreenTitleProps = {
  canSwitchTitle?: boolean;
  isReadOnlyTitle?: boolean;
  onPressTitle?: () => void;
  titleLabel?: string | null;
  variant?: "calendar" | "default";
};

export function AppScreenTitle({
  canSwitchTitle = false,
  isReadOnlyTitle = false,
  onPressTitle,
  titleLabel = null,
  variant = "default",
}: AppScreenTitleProps) {
  const isCalendarVariant = variant === "calendar";
  const canPressTitle = Boolean(titleLabel && canSwitchTitle && onPressTitle);
  const titleContent = titleLabel ? (
    <View style={styles.titleRow}>
      {titleLabel === SubscriptionMessages.screenTitle ? (
        <Text {...CompactTextProps} accessibilityRole="header" style={styles.titleText}>
          알뜰{" "}
          <Text {...CompactTextProps} style={[BrandPlusTextStyle, styles.titleBrandText]}>
            plus
          </Text>
        </Text>
      ) : (
        <>
          <Text
            {...CompactTextProps}
            accessibilityRole="header"
            numberOfLines={1}
            style={[styles.titleText, isCalendarVariant ? styles.calendarTitleText : null]}
          >
            {titleLabel}
          </Text>
          {isReadOnlyTitle ? (
            <View style={styles.readOnlyChip}>
              <Text {...CompactTextProps} style={styles.readOnlyChipText}>
                조회 전용
              </Text>
            </View>
          ) : null}
          {canSwitchTitle ? (
            <Feather
              color={AppColors.mutedStrongText}
              name="chevron-down"
              size={
                isCalendarVariant
                  ? AppScreenTitleUi.calendarSelectorIconSize
                  : AppScreenTitleUi.selectorIconSize
              }
            />
          ) : null}
        </>
      )}
    </View>
  ) : null;
  return (
    <View style={[styles.container, isCalendarVariant ? styles.calendarContainer : null]}>
      <View style={[styles.titleSlot, isCalendarVariant ? styles.calendarTitleSlot : null]}>
        {canPressTitle ? (
          <Pressable
            accessibilityRole="button"
            onPress={onPressTitle}
            style={[styles.titleButton, isCalendarVariant ? styles.calendarTitleButton : null]}
          >
            {titleContent}
          </Pressable>
        ) : (
          titleContent
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: MenuUi.floatingButtonSize,
    marginBottom: AppLayout.screenPadding,
    paddingHorizontal: MenuUi.floatingButtonReservedWidth,
    width: "100%",
  },
  titleSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  titleButton: {
    alignItems: "center",
    minWidth: 0,
    maxWidth: "100%",
  },
  calendarContainer: {
    height: AppScreenTitleUi.calendarSelectorHeight,
    marginBottom: AppLayout.cardGap,
    paddingHorizontal: 0,
  },
  calendarTitleSlot: {
    alignItems: "flex-start",
  },
  calendarTitleButton: {
    height: AppScreenTitleUi.calendarSelectorHeight,
    justifyContent: "center",
    paddingHorizontal: AppScreenTitleUi.calendarSelectorHorizontalPadding,
    borderWidth: AppLayout.dividerWidth,
    borderColor: AppColors.border,
    borderRadius: AppScreenTitleUi.calendarSelectorBorderRadius,
    backgroundColor: AppColors.capsuleSurface,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: AppLayout.compactGap,
    minWidth: 0,
    maxWidth: "100%",
  },
  titleText: {
    ...ScreenTitleTextStyle,
    flexShrink: 1,
  },
  calendarTitleText: {
    fontSize: AppScreenTitleUi.calendarSelectorTitleFontSize,
    lineHeight: AppScreenTitleUi.calendarSelectorTitleLineHeight,
  },
  titleBrandText: {
    fontSize: ScreenTitleTextStyle.fontSize,
  },
  readOnlyChip: {
    borderRadius: AppScreenTitleUi.readOnlyBadgeBorderRadius,
    backgroundColor: AppColors.surfaceStrong,
    paddingHorizontal: AppScreenTitleUi.readOnlyBadgeHorizontalPadding,
    paddingVertical: AppScreenTitleUi.readOnlyBadgeVerticalPadding,
  },
  readOnlyChipText: {
    color: AppColors.expense,
    fontSize: AppScreenTitleUi.readOnlyBadgeFontSize,
    fontWeight: "800",
  },
});
