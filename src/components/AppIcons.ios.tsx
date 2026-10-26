import { SymbolView } from "expo-symbols";
import { StyleSheet, type ColorValue, type StyleProp, type TextStyle } from "react-native";
import { SystemIcons, SystemIconUi } from "../constants/systemIcons";

type Props = {
  name: string;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

export function Feather({ name, size = SystemIconUi.size, color, style, accessibilityLabel }: Props) {
  const symbol = SystemIcons[name as keyof typeof SystemIcons] ?? "square.grid.2x2";
  return <SymbolView name={symbol} size={size} tintColor={color} accessibilityLabel={accessibilityLabel}
    style={[{ width: size, height: size }, StyleSheet.flatten(style)]} />;
}

export const MaterialCommunityIcons = Feather;
