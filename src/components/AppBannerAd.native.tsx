import { Platform, StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

import { AdMobBannerConfig } from "../constants/ads";
import { AppColors } from "../constants/colors";
import { resolveAdMobAdUnitId } from "../lib/ads/adUnitId";
import { logAdMobLoadError } from "../lib/ads/adMobLoadError";
import { getAdRequestOptions } from "../lib/ads/adRequestOptions";

type AppBannerAdProps = {
  variant?: "default" | "embedded";
};

export function AppBannerAd({ variant = "default" }: AppBannerAdProps) {
  const adUnitId = resolveAdMobAdUnitId(AdMobBannerConfig, TestIds.BANNER);

  if (!adUnitId) {
    return null;
  }

  return (
    <View style={[styles.container, variant === "embedded" ? styles.embeddedContainer : null]}>
      <BannerAd
        onAdLoaded={() => {
          console.log("[AdMob] Banner ad loaded", {
            platform: Platform.OS,
            unitId: adUnitId,
          });
        }}
        onAdFailedToLoad={(error) => {
          logAdMobLoadError("AdMob", error, {
            platform: Platform.OS,
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
    backgroundColor: AppColors.adBackground,
    borderBottomColor: AppColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    width: "100%",
  },
  embeddedContainer: {
    backgroundColor: AppColors.adBackground,
    borderBottomWidth: 0,
    borderTopWidth: 0,
  },
});
