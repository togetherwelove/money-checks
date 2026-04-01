import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppColors } from "../constants/colors";

export function BlockingOverlay() {
  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <ActivityIndicator color={AppColors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.overlay,
  },
});
