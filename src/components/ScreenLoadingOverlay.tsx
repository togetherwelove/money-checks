import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppColors } from "../constants/colors";
import { AppLayout } from "../constants/layout";
import { AppMessages } from "../constants/messages";
import { SupportingTextStyle } from "../constants/uiStyles";

export function ScreenLoadingOverlay() {
  return <View style={styles.overlay} accessibilityState={{ busy: true }} accessibilityLiveRegion="polite">
    <ActivityIndicator color={AppColors.primary} />
    <Text style={SupportingTextStyle}>{AppMessages.ledgerLoading}</Text>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: AppColors.screenBackground,
    alignItems: "center", justifyContent: "center", gap: AppLayout.cardGap },
});
