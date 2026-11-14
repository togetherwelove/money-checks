import { FixedColors } from "../../constants/fixedColors";
import { createThemeValue } from "../../lib/appTheme";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthControls } from "../../constants/authControls";
import { getAppColors } from "../../constants/colors";

type Props = {
  icon: ReactNode;
  label: string;
  onPress: () => void | Promise<void>;
  dark?: boolean;
};

export function ProviderSignInButton({ icon, label, onPress, dark = false }: Props) {
  const styles = getStyles();
  useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.button, dark && styles.darkButton]}
    >
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.icon}
      >
        {icon}
      </View>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[styles.label, dark && styles.darkLabel]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    button: {
      height: AuthControls.providerButtonHeight,
      borderWidth: 1,
      borderColor: getAppColors().border,
      borderRadius: AuthControls.borderRadius,
      backgroundColor: getAppColors().surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: AuthControls.providerIconGap,
      paddingHorizontal: AuthControls.providerHorizontalPadding,
    },
    icon: {
      width: AuthControls.providerIconSize,
      height: AuthControls.providerIconSize,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      color: getAppColors().text,
      fontSize: AuthControls.providerFontSize,
      fontWeight: AuthControls.providerFontWeight,
      includeFontPadding: false,
    },
    darkButton: {
      backgroundColor: AuthControls.appleBackground,
      borderColor: AuthControls.appleBackground,
    },
    darkLabel: { color: FixedColors.white },
  }),
);
