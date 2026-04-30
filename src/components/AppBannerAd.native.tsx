import { StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

import { AdMobTestUnitIds } from "../constants/ads";
import { AdMobConfig } from "../constants/subscription";
import { logAdMobLoadError } from "../lib/ads/adMobLoadError";
import { appPlatform } from "../lib/appPlatform";

export function AppBannerAd() {
  const configuredAdUnitId = appPlatform.isIOS
    ? AdMobConfig.iosBannerAdUnitId
    : AdMobConfig.androidBannerAdUnitId;
  const testAdUnitId = appPlatform.isIOS
    ? AdMobTestUnitIds.iosBanner
    : AdMobTestUnitIds.androidBanner;
  const adUnitId = __DEV__ ? testAdUnitId : configuredAdUnitId;

  if (!adUnitId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        onAdLoaded={() => {
          console.log("[AdMob] Banner ad loaded", {
            platform: appPlatform.isIOS ? "ios" : "android",
            unitId: adUnitId,
          });
        }}
        onAdFailedToLoad={(error) => {
          logAdMobLoadError("AdMob", error, {
            platform: appPlatform.isIOS ? "ios" : "android",
            unitId: adUnitId,
            step: "load_banner_ad",
          });
        }}
        size={BannerAdSize.BANNER}
        unitId={adUnitId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
