import { createThemeValue } from "../lib/appTheme";
import { useAppTheme } from "../hooks/useAppTheme";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

import { AdMobBannerConfig, BannerAdLayout } from "../constants/ads";
import { getAppColors } from "../constants/colors";
import { resolveAdMobAdUnitId } from "../lib/ads/adUnitId";
import { logAdMobLoadError } from "../lib/ads/adMobLoadError";
import { getAdRequestOptions } from "../lib/ads/adRequestOptions";

type AppBannerAdProps = {
  variant?: "default" | "embedded";
};

export function AppBannerAd({ variant = "default" }: AppBannerAdProps) {
  const styles = getStyles();
  useAppTheme();
  const adUnitId = resolveAdMobAdUnitId(AdMobBannerConfig, TestIds.BANNER);
  const [loadedUnitId, setLoadedUnitId] = useState<string | null>(null);

  if (!adUnitId) {
    return null;
  }

  return (
    <View style={[styles.container, variant === "embedded" ? styles.embeddedContainer : null]}>
      <View style={styles.slot}>
        <View style={[styles.bannerFrame, loadedUnitId !== adUnitId && styles.loading]}>
          <BannerAd
            onAdLoaded={() => {
              setLoadedUnitId(adUnitId);
              console.log("[AdMob] Banner ad loaded", {
                platform: Platform.OS,
                unitId: adUnitId,
              });
            }}
            onAdFailedToLoad={(error) => {
              setLoadedUnitId(null);
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
      </View>
    </View>
  );
}

const getStyles = createThemeValue(() =>
  StyleSheet.create({
    bannerFrame: {
      width: BannerAdLayout.width,
      height: BannerAdLayout.height,
      overflow: "hidden",
    },
    loading: { opacity: 0 },
    slot: {
      height: BannerAdLayout.height,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      overflow: "hidden",
    },
    container: {
      alignItems: "center",
      backgroundColor: getAppColors().adBackground,
      borderBottomColor: getAppColors().border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      justifyContent: "center",
      width: "100%",
    },
    embeddedContainer: {
      backgroundColor: getAppColors().adBackground,
      borderBottomWidth: 0,
    },
  }),
);
