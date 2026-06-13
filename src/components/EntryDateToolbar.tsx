import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import type { LedgerEntryType } from "../types/ledger";
import { EntryTypeToggleButton } from "./EntryTypeToggleButton";
import { ICON_ACTION_BUTTON_COMPACT_SIZE, IconActionButton } from "./IconActionButton";

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
            accessibilityLabel="오늘 날짜로 이동"
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
    gap: 6,
    justifyContent: "space-between",
    minHeight: ICON_ACTION_BUTTON_COMPACT_SIZE,
    paddingBottom: 8,
    paddingTop: 8,
  },
  dateGroup: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 6,
    justifyContent: "flex-end",
  },
  labelButton: {
    alignItems: "flex-end",
    flexShrink: 1,
    justifyContent: "center",
  },
  labelContent: {
    alignItems: "center",
    columnGap: 6,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  labelIndicator: {
    borderLeftColor: "transparent",
    borderLeftWidth: 4,
    borderRightColor: "transparent",
    borderRightWidth: 4,
    borderTopColor: AppColors.text,
    borderTopWidth: 5,
    height: 0,
    marginTop: 1,
    width: 0,
  },
  labelText: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "700",
  },
});
