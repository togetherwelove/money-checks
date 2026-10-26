import { Feather } from "./AppIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors } from "../constants/colors";
import { AppLayout, AppScreenTitleUi } from "../constants/layout";
import { CompactTextProps } from "../constants/textLayout";
import { ScreenTitleTextStyle } from "../constants/uiStyles";

export function AppNativeHeaderTitle({ title, onPress }: { title: string; onPress?: () => void }) {
  const content = <View style={styles.row}>
    <Text {...CompactTextProps} accessibilityRole="header" numberOfLines={1} style={styles.title}>{title}</Text>
    {onPress ? <Feather name="chevron-down" size={AppScreenTitleUi.selectorIconSize} color={AppColors.text} /> : null}
  </View>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>{content}</Pressable> : content;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: AppLayout.compactGap },
  title: { ...ScreenTitleTextStyle, flexShrink: 1, textAlign: "center" },
});
