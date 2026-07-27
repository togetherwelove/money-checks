import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { SubscriptionMessages } from "../constants/subscription";
import { CompactTextProps } from "../constants/textLayout";
import { BrandPlusTextStyle } from "../constants/uiStyles";

import { IconActionButton } from "./IconActionButton";

type AppHeaderProps = {
  canSwitchTitle?: boolean;
  isMenuOpen?: boolean;
  isReadOnlyTitle?: boolean;
  leadingActionAccessibilityLabel?: string;
  leadingActionLabel?: string | null;
  onOpenMenu: () => void;
  onPressLeadingAction?: () => void;
  onPressTitle?: () => void;
  titleLabel?: string | null;
};

export function AppHeader({
  canSwitchTitle = false,
  isMenuOpen = false,
  isReadOnlyTitle = false,
  leadingActionAccessibilityLabel,
  leadingActionLabel = null,
  onOpenMenu,
  onPressLeadingAction,
  onPressTitle,
  titleLabel = null,
}: AppHeaderProps) {
  const centerLabel = titleLabel;
  const canPressTitle = Boolean(centerLabel && canSwitchTitle && onPressTitle);
  const canPressLeadingAction = Boolean(leadingActionLabel && onPressLeadingAction);
  const titleContent = centerLabel ? (
    <View style={styles.titleRow}>
      {canPressLeadingAction ? (
        <Pressable
          accessibilityLabel={leadingActionAccessibilityLabel}
          accessibilityRole="button"
          onPress={onPressLeadingAction}
          style={styles.leadingAction}
        >
          <Text {...CompactTextProps} numberOfLines={1} style={styles.titleText}>
            {leadingActionLabel}
          </Text>
          <Feather color={AppColors.mutedStrongText} name="chevron-down" size={16} />
        </Pressable>
      ) : null}
      {centerLabel === SubscriptionMessages.screenTitle ? (
        <Text {...CompactTextProps} style={styles.titleText}>
          알뜰 <Text {...CompactTextProps} style={BrandPlusTextStyle}>plus</Text>
        </Text>
      ) : (
        <>
          <Text {...CompactTextProps} numberOfLines={1} style={styles.titleText}>
            {centerLabel}
          </Text>
          {isReadOnlyTitle ? (
            <View style={styles.readOnlyChip}>
              <Text {...CompactTextProps} style={styles.readOnlyChipText}>조회 전용</Text>
            </View>
          ) : null}
          {canSwitchTitle ? (
            <Feather color={AppColors.mutedStrongText} name="chevron-down" size={18} />
          ) : null}
        </>
      )}
    </View>
  ) : null;
  const menuIcon = isMenuOpen ? "x" : "menu";

  return (
    <View style={styles.container}>
      <View style={styles.titleSlot}>
        {canPressTitle ? (
          <Pressable accessibilityRole="button" onPress={onPressTitle} style={styles.titleButton}>
            {titleContent}
          </Pressable>
        ) : (
          titleContent
        )}
      </View>
      <View style={styles.trailingSlot}>
        <IconActionButton
          icon={menuIcon}
          isActive={isMenuOpen}
          onPress={onOpenMenu}
          size="compact"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  trailingSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 0,
  },
  titleSlot: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    minWidth: 0,
  },
  titleButton: {
    minWidth: 0,
    maxWidth: "100%",
  },
  leadingAction: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
    maxWidth: "100%",
  },
  titleText: {
    flexShrink: 1,
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  readOnlyChip: {
    borderRadius: 999,
    backgroundColor: AppColors.surfaceStrong,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  readOnlyChipText: {
    color: AppColors.expense,
    fontSize: 10,
    fontWeight: "800",
  },
});
