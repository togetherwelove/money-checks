import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { Image, StyleSheet, View } from "react-native";

import { getAppColors } from "../constants/colors";

const APP_ICON_SOURCE = require("../../assets/app/icon.png");
const LOGO_SIZE = 128;

export function SessionLoadingScreen() {
  const styles = getStyles();
  useAppTheme();
  return (
    <View style={styles.screen}>
      <Image source={APP_ICON_SOURCE} style={styles.logo} />
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    screen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: getAppColors().appIconBackground,
    },
    logo: {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      backgroundColor: getAppColors().appIconBackground,
    },
  }),
);
