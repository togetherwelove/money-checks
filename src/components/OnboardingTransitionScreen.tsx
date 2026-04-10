import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppColors } from "../constants/colors";

export function OnboardingTransitionScreen() {
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={AppColors.primary} size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background,
  },
});
