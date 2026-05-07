import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  NativeAd,
  NativeAdChoicesPlacement,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from "react-native-google-mobile-ads";

import {
  AdMobNativeConfig,
  AdMobTestUnitIds,
  NativeAdCardUi,
  NativeAdListConfig,
} from "../constants/ads";
import { AppColors } from "../constants/colors";
import { OneLineTextFitProps } from "../constants/textLayout";
import { getAdRequestOptions } from "../lib/ads/adRequestOptions";
import { appPlatform } from "../lib/appPlatform";
import { logAppError } from "../lib/logAppError";

type AppNativeAdCardProps = {
  slotIndex: number;
};

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
          ...getAdRequestOptions(),
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
    <NativeAdView nativeAd={nativeAd}>
      <View style={styles.entryRow}>
        {nativeAd.icon ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{ uri: nativeAd.icon.url }} style={styles.icon} />
          </NativeAsset>
        ) : null}
        <View style={styles.content}>
          <View style={styles.primaryRow}>
            <View style={styles.copyColumn}>
              <View style={styles.headlineRow}>
                <Text style={styles.sponsoredLabel}>{NativeAdListConfig.sponsoredLabel}</Text>
                <NativeAsset assetType={NativeAssetType.HEADLINE}>
                  <Text {...OneLineTextFitProps} style={styles.headline}>
                    {nativeAd.headline}
                  </Text>
                </NativeAsset>
              </View>
              {nativeAd.advertiser ? (
                <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                  <Text {...OneLineTextFitProps} style={styles.advertiser}>
                    {nativeAd.advertiser}
                  </Text>
                </NativeAsset>
              ) : null}
            </View>
            {nativeAd.callToAction ? (
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <Text
                  {...OneLineTextFitProps}
                  style={[styles.callToAction, styles.callToActionText]}
                >
                  {nativeAd.callToAction}
                </Text>
              </NativeAsset>
            ) : null}
          </View>
          {nativeAd.body ? (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text numberOfLines={2} style={styles.body}>
                {nativeAd.body}
              </Text>
            </NativeAsset>
          ) : null}
        </View>
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
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: AppColors.border,
    flexDirection: "row",
    gap: NativeAdCardUi.primaryRowGap,
    minHeight: NativeAdCardUi.minHeight,
    paddingVertical: NativeAdCardUi.verticalInset,
  },
  content: {
    flex: 1,
    gap: NativeAdCardUi.contentGap,
    minWidth: 0,
  },
  copyColumn: {
    flex: 1,
    minWidth: 0,
  },
  primaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: NativeAdCardUi.primaryRowGap,
    minWidth: 0,
  },
  headlineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: NativeAdCardUi.advertiserGap,
    minWidth: 0,
  },
  icon: {
    borderRadius: NativeAdCardUi.iconBorderRadius,
    height: NativeAdCardUi.iconSize,
    width: NativeAdCardUi.iconSize,
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
    minWidth: 0,
  },
  advertiser: {
    color: AppColors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  body: {
    color: AppColors.mutedText,
    fontSize: 12,
    lineHeight: 16,
  },
  callToAction: {
    backgroundColor: AppColors.primary,
    borderRadius: NativeAdCardUi.callToActionBorderRadius,
    paddingHorizontal: NativeAdCardUi.callToActionPaddingHorizontal,
    paddingVertical: NativeAdCardUi.callToActionPaddingVertical,
  },
  callToActionText: {
    color: AppColors.inverseText,
    fontSize: 12,
    fontWeight: "800",
  },
});
