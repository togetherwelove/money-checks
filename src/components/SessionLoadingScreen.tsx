import { Image, StyleSheet, View } from "react-native";

import { AppColors } from "../constants/colors";

const APP_ICON_SOURCE = require("../../assets/app/icon.png");
const LOGO_SIZE = 128;

export function SessionLoadingScreen() {
  return (
    <View style={styles.screen}>
      <Image source={APP_ICON_SOURCE} style={styles.logo} />
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
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    backgroundColor: AppColors.sessionLoadingBackground,
  },
});
