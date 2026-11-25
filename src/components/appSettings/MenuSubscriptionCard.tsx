import { Pressable, StyleSheet, Text, View } from "react-native";
import { getAppColors } from "../../constants/colors";
import { MenuSubscriptionCopy, MenuSubscriptionDesign } from "../../constants/allMenu";
import { SettingsGroupDesign } from "../../constants/settingsGroupStyles";
import { SubscriptionMessages } from "../../constants/subscription";
import {
  AppTextBreakProps,
  ContentTextProps,
  OneLineTextFitProps,
} from "../../constants/textLayout";
import { useAppTheme } from "../../hooks/useAppTheme";
import { createThemeValue } from "../../lib/appTheme";

type Props = { isPlusActive: boolean; onPress: () => void };

export function MenuSubscriptionCard({ isPlusActive, onPress }: Props) {
  useAppTheme();
  const styles = getStyles();
  const actionLabel = isPlusActive
    ? SubscriptionMessages.manageAction
    : MenuSubscriptionCopy.upgradeAction;
  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text {...AppTextBreakProps} {...ContentTextProps} style={styles.message}>
          <Text style={styles.highlight}>{MenuSubscriptionCopy.headline}</Text>
          {"\n"}
          {MenuSubscriptionCopy.description}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${SubscriptionMessages.screenTitle} ${actionLabel}`}
        onPress={onPress}
        hitSlop={MenuSubscriptionDesign.buttonHitSlop}
        style={styles.button}
      >
        <Text {...OneLineTextFitProps} style={styles.buttonText}>
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    banner: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: SettingsGroupDesign.contentGap,
      paddingHorizontal: SettingsGroupDesign.horizontalPadding,
      paddingVertical: SettingsGroupDesign.verticalPadding,
    },
    content: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: MenuSubscriptionDesign.copyMinimumWidth,
      minWidth: MenuSubscriptionDesign.copyMinimumWidth,
    },
    highlight: { fontWeight: "700" },
    message: {
      color: getAppColors().mutedText,
      fontSize: SettingsGroupDesign.labelFontSize,
      lineHeight: SettingsGroupDesign.labelLineHeight,
      fontWeight: "400",
    },
    button: {
      flexShrink: 0,
      marginLeft: "auto",
      borderRadius: MenuSubscriptionDesign.buttonHeight / 2,
      minHeight: MenuSubscriptionDesign.buttonHeight,
      paddingHorizontal: MenuSubscriptionDesign.buttonHorizontalPadding,
      paddingVertical: MenuSubscriptionDesign.buttonVerticalPadding,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: getAppColors().text,
    },
    buttonText: {
      color: getAppColors().background,
      fontSize: SettingsGroupDesign.descriptionFontSize,
      lineHeight: SettingsGroupDesign.descriptionLineHeight,
      fontWeight: "400",
    },
  }),
);
