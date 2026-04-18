import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  NativeAd,
  NativeAdChoicesPlacement,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from "react-native-google-mobile-ads";

import { AdMobNativeConfig, AdMobTestUnitIds, NativeAdListConfig } from "../constants/ads";
import { AppColors } from "../constants/colors";
import { appPlatform } from "../lib/appPlatform";
import { logAppError } from "../lib/logAppError";

type AppNativeAdCardProps = {
  slotIndex: number;
};

const NATIVE_AD_VERTICAL_INSET = 6;
const NATIVE_AD_ROW_GAP = 6;

export function AppNativeAdCard({ slotIndex }: AppNativeAdCardProps) {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    let isMounted = true;
    let activeNativeAd: NativeAd | null = null;

    const loadNativeAd = async () => {
      const adUnitId = resolveNativeAdUnitId();
      if (!adUnitId) {
        return;
      }

      try {
        activeNativeAd = await NativeAd.createForAdRequest(adUnitId, {
          adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
        });
        if (!isMounted) {
          activeNativeAd.destroy();
          return;
        }

        setNativeAd(activeNativeAd);
      } catch (error) {
        logAppError("AdMob", error, {
          platform: appPlatform.isIOS ? "ios" : "android",
          slotIndex,
          step: "load_native_ad",
          unitId: adUnitId,
        });
      }
    };

    void loadNativeAd();

    return () => {
      isMounted = false;
      activeNativeAd?.destroy();
    };
  }, [slotIndex]);

  if (!nativeAd) {
    return null;
  }

  return (
    <NativeAdView nativeAd={nativeAd} style={styles.entryRow}>
      <View style={styles.content}>
        <View style={styles.primaryRow}>
          <Text style={styles.sponsoredLabel}>{NativeAdListConfig.sponsoredLabel}</Text>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text numberOfLines={1} style={styles.headline}>
              {nativeAd.headline}
            </Text>
          </NativeAsset>
        </View>
        {nativeAd.body ? (
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text numberOfLines={1} style={styles.body}>
              {nativeAd.body}
            </Text>
          </NativeAsset>
        ) : null}
      </View>
    </NativeAdView>
  );
}

function resolveNativeAdUnitId() {
  if (__DEV__) {
    return appPlatform.isIOS ? AdMobTestUnitIds.iosNative : AdMobTestUnitIds.androidNative;
  }

  return appPlatform.isIOS ? AdMobNativeConfig.iosAdUnitId : AdMobNativeConfig.androidAdUnitId;
}

const styles = StyleSheet.create({
  entryRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  content: {
    flex: 1,
    paddingVertical: NATIVE_AD_VERTICAL_INSET,
    minWidth: 0,
  },
  primaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: NATIVE_AD_ROW_GAP,
    minWidth: 0,
  },
  sponsoredLabel: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headline: {
    flex: 1,
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  body: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 16,
  },
});
