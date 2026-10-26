import { DateTimePicker, Host } from "@expo/ui/jetpack-compose";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({ host: { alignSelf: "stretch" } });

export function EntryInlineDatePicker({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  // Material date pickers represent calendar days as UTC midnight.
  const initialDate = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  return <Host matchContents={{ vertical: true }} colorScheme="light" style={styles.host}>
    <DateTimePicker initialDate={initialDate.toISOString()}
      onDateSelected={date => onChange(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))}
      displayedComponents="date" showTitle={false} showHeadline={false} showVariantToggle={false} />
  </Host>;
}
