import { StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

import { AppColors } from "../constants/colors";
import { AdMobConfig } from "../constants/subscription";
import { appPlatform } from "../lib/appPlatform";

export function AppBannerAd() {
  const adUnitId = appPlatform.isIOS
    ? AdMobConfig.iosBannerAdUnitId
    : AdMobConfig.androidBannerAdUnitId;

  if (!adUnitId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd size={BannerAdSize.BANNER} unitId={adUnitId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 6,
  },
});
