import { StyleSheet, View } from "react-native";

import { DateNavigationToolbar } from "./DateNavigationToolbar";

type CalendarToolbarProps = {
  monthLabel: string;
  onSelectToday: () => void;
  onPressMonthLabel?: (() => void) | null;
  showMoveToCurrent: boolean;
};

export function CalendarToolbar({
  monthLabel,
  onSelectToday,
  onPressMonthLabel = null,
  showMoveToCurrent,
}: CalendarToolbarProps) {
  return (
    <View>
      <View style={styles.labelArea}>
        <DateNavigationToolbar
          label={monthLabel}
          onMoveToCurrent={onSelectToday}
          onPressLabel={onPressMonthLabel}
          showMoveToCurrent={showMoveToCurrent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelArea: {
    flex: 1,
  },
});
