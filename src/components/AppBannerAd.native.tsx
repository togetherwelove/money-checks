import { StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

import { AdMobTestUnitIds } from "../constants/ads";
import { AppColors } from "../constants/colors";
import { AdMobConfig } from "../constants/subscription";
import { logAdMobLoadError } from "../lib/ads/adMobLoadError";
import { getAdRequestOptions } from "../lib/ads/adRequestOptions";
import { appPlatform } from "../lib/appPlatform";

type AppBannerAdProps = {
  variant?: "default" | "embedded";
};

export function AppBannerAd({ variant = "default" }: AppBannerAdProps) {
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
    <View style={[styles.container, variant === "embedded" ? styles.embeddedContainer : null]}>
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
        requestOptions={getAdRequestOptions()}
        size={BannerAdSize.BANNER}
        unitId={adUnitId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: AppColors.surfaceMuted,
    borderBottomColor: AppColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    width: "100%",
  },
  embeddedContainer: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderTopWidth: 0,
  },
});
