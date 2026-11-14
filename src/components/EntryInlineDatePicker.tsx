import { useAppTheme } from "../hooks/useAppTheme";
import DateTimePicker from "@react-native-community/datetimepicker";

export function EntryInlineDatePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const colorScheme = useAppTheme();
  return (
    <DateTimePicker
      themeVariant={colorScheme}
      display="inline"
      locale="ko-KR"
      mode="date"
      value={value}
      onChange={(_event, date) => {
        if (date) onChange(date);
      }}
    />
  );
}
