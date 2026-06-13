import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";

const APP_ICON_SOURCE = require("../../assets/app/icon.png");
const LOGO_SIZE = 128;
const CONTENT_GAP = AppLayout.cardGap * 2;

type SessionLoadingScreenProps = {
  label?: string;
};

export function SessionLoadingScreen({
  label = AppMessages.authLoading,
}: SessionLoadingScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Image source={APP_ICON_SOURCE} style={styles.logo} />
        <ActivityIndicator color={AppColors.primary} size="small" />
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.sessionLoadingBackground,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: CONTENT_GAP,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    backgroundColor: AppColors.sessionLoadingBackground,
  },
  label: {
    color: AppColors.mutedStrongText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
