import { Feather } from "@expo/vector-icons";
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
import { AppTextBreakProps, OneLineTextFitProps } from "../constants/textLayout";
import { getAdRequestOptions } from "../lib/ads/adRequestOptions";
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
          platform: "ios",
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
    <NativeAdView nativeAd={nativeAd} style={styles.nativeAdView}>
      <View style={styles.content}>
        <View style={styles.detailsRow}>
          {nativeAd.icon ? (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <View style={styles.iconFrame}>
                <Image source={{ uri: nativeAd.icon.url }} style={styles.icon} />
              </View>
            </NativeAsset>
          ) : null}
          <View style={styles.copyColumn}>
            <View style={styles.mainCopy}>
              <View style={styles.headlineBlock}>
                <Text style={styles.sponsoredLabel}>{NativeAdListConfig.sponsoredLabel}</Text>
                <NativeAsset assetType={NativeAssetType.HEADLINE}>
                  <Text {...AppTextBreakProps} numberOfLines={1} style={styles.headline}>
                    {nativeAd.headline}
                  </Text>
                </NativeAsset>
              </View>
              {nativeAd.body ? (
                <NativeAsset assetType={NativeAssetType.BODY}>
                  <Text {...AppTextBreakProps} numberOfLines={2} style={styles.body}>
                    {nativeAd.body}
                  </Text>
                </NativeAsset>
              ) : null}
            </View>
          </View>
          {nativeAd.callToAction ? (
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <View
                accessibilityLabel={nativeAd.callToAction}
                accessibilityRole="button"
                style={styles.callToAction}
              >
                <Feather
                  color={AppColors.inverseText}
                  name="download"
                  size={NativeAdCardUi.callToActionIconSize}
                />
                <Text {...OneLineTextFitProps} style={styles.callToActionText}>
                  {nativeAd.callToAction}
                </Text>
              </View>
            </NativeAsset>
          ) : null}
        </View>
      </View>
    </NativeAdView>
  );
}

function resolveNativeAdUnitId() {
  if (__DEV__) {
    return AdMobTestUnitIds.iosNative;
  }

  return AdMobNativeConfig.iosAdUnitId;
}

const styles = StyleSheet.create({
  nativeAdView: {
    backgroundColor: AppColors.background,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
    minHeight: NativeAdCardUi.minHeight,
  },
  content: {
    paddingHorizontal: NativeAdCardUi.contentPaddingHorizontal,
    paddingVertical: NativeAdCardUi.contentPaddingVertical,
  },
  detailsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: NativeAdCardUi.contentGap,
  },
  copyColumn: {
    flex: 1,
    gap: NativeAdCardUi.textBlockGap,
    minWidth: 0,
  },
  mainCopy: {
    flexShrink: 1,
    gap: NativeAdCardUi.textBlockGap,
    minWidth: 0,
  },
  headlineBlock: {
    alignItems: "center",
    flexDirection: "row",
    gap: NativeAdCardUi.textBlockGap,
    minWidth: 0,
  },
  icon: {
    height: "100%",
    width: "100%",
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: AppColors.surfaceMuted,
    borderRadius: NativeAdCardUi.iconBorderRadius,
    flexShrink: 0,
    height: NativeAdCardUi.iconSize,
    justifyContent: "center",
    overflow: "hidden",
    width: NativeAdCardUi.iconSize,
  },
  sponsoredLabel: {
    color: AppColors.mutedText,
    flexShrink: 0,
    fontSize: NativeAdCardUi.sponsoredLabelFontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headline: {
    color: AppColors.text,
    fontSize: NativeAdCardUi.headlineFontSize,
    fontWeight: "700",
    flex: 1,
    lineHeight: NativeAdCardUi.headlineLineHeight,
    minWidth: 0,
  },
  body: {
    color: AppColors.mutedText,
    fontSize: NativeAdCardUi.bodyFontSize,
    lineHeight: NativeAdCardUi.bodyLineHeight,
  },
  callToAction: {
    alignItems: "center",
    backgroundColor: AppColors.primary,
    borderRadius: NativeAdCardUi.callToActionIconBorderRadius,
    flexDirection: "row",
    flexShrink: 0,
    gap: NativeAdCardUi.callToActionGap,
    height: NativeAdCardUi.callToActionIconButtonSize,
    justifyContent: "center",
    paddingHorizontal: NativeAdCardUi.callToActionPaddingHorizontal,
  },
  callToActionText: {
    color: AppColors.inverseText,
    fontSize: NativeAdCardUi.callToActionTextFontSize,
    fontWeight: "700",
    maxWidth: NativeAdCardUi.callToActionTextMaxWidth,
  },
});
