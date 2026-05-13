import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import {
  DateNavigationToolbarCopy,
  DateNavigationToolbarLayout,
} from "../constants/dateNavigationToolbar";
import type { LedgerEntryType } from "../types/ledger";
import { EntryTypeToggleButton } from "./EntryTypeToggleButton";
import { IconActionButton } from "./IconActionButton";

type EntryDateToolbarProps = {
  dateLabel: string;
  onPressDateLabel: () => void;
  onMoveToToday: () => void;
  onSelectType: (type: LedgerEntryType) => void;
  selectedType: LedgerEntryType;
  showMoveToToday: boolean;
};

export function EntryDateToolbar({
  dateLabel,
  onPressDateLabel,
  onMoveToToday,
  onSelectType,
  selectedType,
  showMoveToToday,
}: EntryDateToolbarProps) {
  return (
    <View style={styles.container}>
      <EntryTypeToggleButton onSelectType={onSelectType} selectedType={selectedType} />
      <View style={styles.dateGroup}>
        {showMoveToToday ? (
          <IconActionButton
            accessibilityLabel={DateNavigationToolbarCopy.moveToTodayAccessibilityLabel}
            icon="crosshair"
            onPress={onMoveToToday}
            size="compact"
          />
        ) : null}
        <Pressable onPress={onPressDateLabel} style={styles.labelButton}>
          <View style={styles.labelContent}>
            <Text style={styles.labelText}>{dateLabel}</Text>
            <View style={styles.labelIndicator} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: DateNavigationToolbarLayout.labelGap,
    justifyContent: "space-between",
    minHeight: DateNavigationToolbarLayout.defaultMinHeight,
    paddingBottom: DateNavigationToolbarLayout.defaultBottomPadding,
    paddingTop: DateNavigationToolbarLayout.defaultTopPadding,
  },
  dateGroup: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: DateNavigationToolbarLayout.labelGap,
    justifyContent: "flex-end",
  },
  labelButton: {
    alignItems: "flex-end",
    flexShrink: 1,
    justifyContent: "center",
  },
  labelContent: {
    alignItems: "center",
    columnGap: DateNavigationToolbarLayout.labelGap,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  labelIndicator: {
    borderLeftColor: "transparent",
    borderLeftWidth: DateNavigationToolbarLayout.indicatorSize,
    borderRightColor: "transparent",
    borderRightWidth: DateNavigationToolbarLayout.indicatorSize,
    borderTopColor: AppColors.text,
    borderTopWidth: 5,
    height: 0,
    marginTop: DateNavigationToolbarLayout.indicatorTopMargin,
    width: 0,
  },
  labelText: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "700",
  },
});
