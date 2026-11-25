import { Pressable, Text, View } from "react-native";
import {
  AllEntriesPeriodPresets as Presets,
  AllEntriesPeriodCopy as Copy,
  type AllEntriesDateRange,
} from "../../constants/allEntries";
import { getAllEntriesFilterStyles } from "../../constants/allEntriesFilterStyles";
import { resolveAllEntriesPeriod } from "../../lib/allEntriesPeriods";
import { useAppTheme } from "../../hooks/useAppTheme";

export function AllEntriesPeriodPresets({
  range,
  onChange,
  editing = false,
  onCustom,
}: {
  range: AllEntriesDateRange | null;
  onChange: (range: AllEntriesDateRange | null) => void;
  editing?: boolean;
  onCustom?: () => void;
}) {
  useAppTheme();
  const styles = getAllEntriesFilterStyles();
  const now = new Date();
  const matchesPreset = Presets.some((preset) => {
    const dates = resolveAllEntriesPeriod(preset.value, now);
    return range?.startDate === dates.startDate && range?.endDate === dates.endDate;
  });
  const options = [
    { key: "all", label: Copy.all, selected: !range, onPress: () => onChange(null) },
    ...Presets.map((preset) => {
      const dates = resolveAllEntriesPeriod(preset.value, now);
      return {
        key: preset.value,
        label: preset.label,
        selected:
          !editing && range?.startDate === dates.startDate && range?.endDate === dates.endDate,
        onPress: () => onChange(resolveAllEntriesPeriod(preset.value)),
      };
    }),
    {
      key: "custom",
      label: Copy.custom,
      selected: Boolean(range) && (editing || !matchesPreset),
      onPress: () => onCustom?.(),
    },
  ];
  return (
    <View style={styles.options}>
      {options.map((option) => (
        <Pressable
          key={option.key}
          accessibilityRole="button"
          accessibilityState={{ selected: option.selected }}
          onPress={option.onPress}
          style={[styles.option, option.selected && styles.selected]}
        >
          <Text style={[styles.optionLabel, option.selected && styles.selectedLabel]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
