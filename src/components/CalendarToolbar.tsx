import { StyleSheet, View } from "react-native";

import { DateNavigationToolbarCopy } from "../constants/dateNavigationToolbar";
import { AppLayout } from "../constants/layout";
import { DateNavigationToolbar } from "./DateNavigationToolbar";
import { IconActionButton } from "./IconActionButton";

type CalendarToolbarProps = {
  monthLabel: string;
  onMoveNextMonth?: (() => void) | null;
  onMovePreviousMonth?: (() => void) | null;
  onSelectToday: () => void;
  onPressMonthLabel?: (() => void) | null;
  showMoveToCurrent: boolean;
};

export function CalendarToolbar({
  monthLabel,
  onMoveNextMonth = null,
  onMovePreviousMonth = null,
  onSelectToday,
  onPressMonthLabel = null,
  showMoveToCurrent,
}: CalendarToolbarProps) {
  const showsMonthMoveButtons = Boolean(onMovePreviousMonth && onMoveNextMonth);

  return (
    <View style={showsMonthMoveButtons ? styles.webContainer : null}>
      {onMovePreviousMonth ? (
        <IconActionButton
          accessibilityLabel={DateNavigationToolbarCopy.previousMonthAccessibilityLabel}
          icon="chevron-left"
          onPress={onMovePreviousMonth}
        />
      ) : null}
      <View style={styles.labelArea}>
        <DateNavigationToolbar
          label={monthLabel}
          onMoveToCurrent={onSelectToday}
          onPressLabel={onPressMonthLabel}
          showMoveToCurrent={showMoveToCurrent}
        />
      </View>
      {onMoveNextMonth ? (
        <IconActionButton
          accessibilityLabel={DateNavigationToolbarCopy.nextMonthAccessibilityLabel}
          icon="chevron-right"
          onPress={onMoveNextMonth}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelArea: {
    flex: 1,
  },
  webContainer: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: AppLayout.compactGap,
  },
});
