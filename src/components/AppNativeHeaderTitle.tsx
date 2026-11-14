import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { Feather } from "./AppIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getAppColors } from "../constants/colors";
import { AppLayout, AppScreenTitleUi } from "../constants/layout";
import { CompactTextProps } from "../constants/textLayout";
import { getScreenTitleTextStyle } from "../constants/uiStyles";

export function AppNativeHeaderTitle({ title, onPress }: { title: string; onPress?: () => void }) {
  const styles = getStyles();
  useAppTheme();
  const content = (
    <View style={styles.row}>
      <Text {...CompactTextProps} accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      {onPress ? (
        <Feather
          name="chevron-down"
          size={AppScreenTitleUi.selectorIconSize}
          color={getAppColors().text}
        />
      ) : null}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: AppLayout.compactGap,
    },
    title: { ...getScreenTitleTextStyle(), flexShrink: 1, textAlign: "center" },
  }),
);
