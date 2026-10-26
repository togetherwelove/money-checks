import { Host, Picker, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";

export function SettingsValueSelector<Value extends string>({ value, options, onChange }: {
  value: Value;
  options: readonly { label: string; value: Value }[];
  onChange: (value: Value) => void;
}) {
  return <Host matchContents>
    <Picker selection={value} onSelectionChange={onChange} modifiers={[pickerStyle("menu")]}>
      {options.map(option => <Text key={option.value} modifiers={[tag(option.value)]}>{option.label}</Text>)}
    </Picker>
  </Host>;
}
