import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarSummaryLabels } from "../../constants/calendarSummary";
import { AppColors } from "../../constants/colors";
import { EntryTypeToggleUi } from "../../constants/entryRegistration";
import type { LedgerEntryType } from "../../types/ledger";

const entryTypes = ["expense", "income"] as const;
export function CategoryTypeTabs({ value, disabled, onChange }: {
  value: LedgerEntryType; disabled: boolean; onChange: (type: LedgerEntryType) => void;
}) {
  return <View style={styles.tabs}>
    {entryTypes.map((type) => <Pressable key={type} accessibilityRole="tab"
      accessibilityState={{ selected: value === type, disabled }} disabled={disabled}
      onPress={() => onChange(type)} style={[styles.tab, value === type && styles.selected]}>
      <Text style={[styles.label, value === type && styles.selectedLabel]}>{CalendarSummaryLabels[type]}</Text>
    </Pressable>)}
  </View>;
}
const styles = StyleSheet.create({
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: AppColors.border },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: EntryTypeToggleUi.containerHeight,
    borderBottomWidth: EntryTypeToggleUi.indicatorHeight, borderBottomColor: AppColors.transparent },
  selected: { borderBottomColor: AppColors.primary },
  label: { fontSize: EntryTypeToggleUi.labelFontSize, fontWeight: "700", color: AppColors.mutedText },
  selectedLabel: { color: AppColors.primary },
});
