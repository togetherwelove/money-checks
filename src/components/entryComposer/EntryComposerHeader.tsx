import { MaterialCommunityIcons } from "../AppIcons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors } from "../../constants/colors";
import { EntryComposerCopy as Copy, EntryComposerUi as Ui } from "../../constants/entryComposer";
import { AppLayout } from "../../constants/layout";
import { useExpenseTextColor } from "../../contexts/ExpenseTextColorContext";
import type { EntryComposerHeaderProps } from "./EntryComposerHeader.types";

const options = [{ type: "expense", label: Copy.expense }, { type: "income", label: Copy.income }] as const;

export function EntryComposerHeader({ title, type = "expense", onSelectType, typeDisabled = false, saving = false, actionDisabled = false, actionLabel, onAction, onClose }: EntryComposerHeaderProps) {
  const expenseStyle = useExpenseTextColor().textStyle;
  return <View style={styles.header}>
    <Pressable accessibilityRole="button" accessibilityLabel={Copy.closeSheet} disabled={saving}
      accessibilityState={{ disabled: saving }} onPress={onClose}
      style={[styles.circle, saving && styles.disabled]}>
      <MaterialCommunityIcons name="close" size={Ui.sheetIconSize} color={AppColors.text} />
    </Pressable>
    {title ? <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>{title}</Text> : <View style={styles.segments}>
      {options.map(option => <Pressable key={option.type} accessibilityRole="tab"
        accessibilityState={{ selected: type === option.type, disabled: typeDisabled }} disabled={typeDisabled}
        onPress={() => onSelectType?.(option.type)}
        style={[styles.segment, type === option.type && styles.selected]}>
        <Text numberOfLines={1} style={[styles.label, type === option.type && styles.selectedLabel,
          type === option.type && (type === "expense" ? expenseStyle : styles.income)]}>{option.label}</Text>
      </Pressable>)}
    </View>}
    {onAction ? <Pressable accessibilityRole="button" accessibilityLabel={actionLabel}
      accessibilityState={{ disabled: actionDisabled || saving, busy: saving }} disabled={actionDisabled || saving}
      onPress={() => { if (!actionDisabled && !saving) onAction(); }} style={[styles.circle, styles.confirm, (actionDisabled || saving) && styles.disabled]}>
      {saving ? <ActivityIndicator color={AppColors.inverseText} />
        : <MaterialCommunityIcons name="check" size={Ui.sheetIconSize} color={AppColors.inverseText} />}
    </Pressable> : <View style={styles.spacer} />}
  </View>;
}

const styles = StyleSheet.create({
  spacer: { width: Ui.sheetControlSize, height: Ui.sheetControlSize },
  title: { flex: 1, textAlign: "center", color: AppColors.text, fontSize: Ui.sheetFieldFontSize, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", gap: AppLayout.cardGap, padding: Ui.sheetPadding },
  circle: { width: Ui.sheetControlSize, height: Ui.sheetControlSize, borderRadius: Ui.sheetControlSize / 2,
    backgroundColor: AppColors.surfaceStrong, justifyContent: "center", alignItems: "center" },
  confirm: { backgroundColor: AppColors.primary },
  disabled: { opacity: Ui.disabledOpacity },
  segments: { flex: 1, flexDirection: "row", backgroundColor: AppColors.surfaceStrong, borderRadius: Ui.sheetCardRadius, padding: Ui.segmentInset },
  segment: { flex: 1, minHeight: Ui.sheetControlSize - Ui.segmentInset * 2, alignItems: "center", justifyContent: "center", borderRadius: Ui.sheetCardRadius },
  selected: { backgroundColor: AppColors.surface },
  label: { fontSize: Ui.sheetSegmentFontSize, color: AppColors.mutedText },
  selectedLabel: { fontWeight: "700" },
  income: { color: AppColors.income },
});
