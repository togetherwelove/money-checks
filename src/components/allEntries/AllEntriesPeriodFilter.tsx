import { type ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AllEntriesPeriodCopy as Copy, type AllEntriesDateRange } from "../../constants/allEntries";
import { getAllEntriesFilterStyles } from "../../constants/allEntriesFilterStyles";
import { parseIsoDate, toIsoDate } from "../../utils/calendar";
import { resolveAllEntriesPeriod } from "../../lib/allEntriesPeriods";
import { EntryInlineDatePicker } from "../EntryInlineDatePicker";
import { useAppTheme } from "../../hooks/useAppTheme";
import { AllEntriesPeriodPresets } from "./AllEntriesPeriodPresets";

export function AllEntriesPeriodFilter({
  range,
  onChange,
  headingAction,
}: {
  range: AllEntriesDateRange | null;
  headingAction?: ReactNode;
  onChange: (range: AllEntriesDateRange | null) => void;
}) {
  useAppTheme();
  const [field, setField] = useState<"startDate" | "endDate">("startDate");
  const [editing, setEditing] = useState(false);
  const styles = getAllEntriesFilterStyles();
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {Copy.title}
        </Text>
        {headingAction}
      </View>
      <AllEntriesPeriodPresets
        range={range}
        editing={editing}
        onChange={(dates) => {
          setEditing(false);
          setField("startDate");
          onChange(dates);
        }}
        onCustom={() => {
          setEditing(true);
          if (!range) onChange(resolveAllEntriesPeriod("this-month"));
        }}
      />
      {range ? (
        <View style={styles.dateFields}>
          {(["startDate", "endDate"] as const).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`${key === "startDate" ? Copy.start : Copy.end} ${range[key]}`}
              accessibilityState={{ selected: editing && field === key }}
              onPress={() => {
                setField(key);
                setEditing(true);
              }}
              style={[styles.dateField, editing && field === key && styles.selected]}
            >
              <Text style={styles.dateCaption}>{key === "startDate" ? Copy.start : Copy.end}</Text>
              <Text style={[styles.dateValue, editing && field === key && styles.selectedLabel]}>
                {range[key]}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {range && editing ? (
        <View style={styles.calendar}>
          <EntryInlineDatePicker
            value={parseIsoDate(range[field])}
            onChange={(date) => {
              const value = toIsoDate(date);
              onChange(
                field === "startDate"
                  ? { startDate: value, endDate: value > range.endDate ? value : range.endDate }
                  : {
                      startDate: value < range.startDate ? value : range.startDate,
                      endDate: value,
                    },
              );
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
