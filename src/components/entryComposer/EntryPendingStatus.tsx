import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { AppColors } from "../../constants/colors";
import { EntryComposerCopy, EntryComposerDots, EntryComposerUi } from "../../constants/entryComposer";
import { CalendarSummaryLabels } from "../../constants/calendarSummary";
import { AppLayout } from "../../constants/layout";
import { useExpenseTextColor } from "../../contexts/ExpenseTextColorContext";
import type { LedgerEntryType } from "../../types/ledger";

export function EntryPendingStatus({ entryType, editing = false }: { entryType: LedgerEntryType; editing?: boolean }) {
  const label = editing ? EntryComposerCopy.editing : EntryComposerCopy.pending;
  const expenseColor = useExpenseTextColor().textColor;
  const typeLabel = entryType === "income" ? CalendarSummaryLabels.income : CalendarSummaryLabels.expense;
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const animation = Animated.loop(Animated.timing(progress, {
      toValue: EntryComposerDots.phases.length - 1,
      duration: EntryComposerDots.cycleDurationMs,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    animation.start();
    return () => { animation.stop(); progress.setValue(0); };
  }, [progress, reduceMotion]);

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={`${typeLabel} ${label}`} style={styles.status}>
      <Text style={[styles.text, styles.typeLabel, { color: entryType === "income" ? AppColors.income : expenseColor }]}>{typeLabel}</Text>
      <Text style={styles.text}>{label}</Text>
      {EntryComposerDots.offsets.map((offsets, index) => (
        <Animated.Text key={index} accessible={false} style={[styles.text, {
          transform: [{ translateY: reduceMotion ? 0 : progress.interpolate({
            inputRange: [...EntryComposerDots.phases], outputRange: [...offsets],
          }) }],
        }]}>{EntryComposerDots.character}</Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: "row", alignItems: "center" },
  text: { fontSize: EntryComposerUi.pendingTitleFontSize, fontWeight: "700", color: AppColors.mutedStrongText },
  typeLabel: { fontWeight: "700", marginRight: AppLayout.compactGap },
});
