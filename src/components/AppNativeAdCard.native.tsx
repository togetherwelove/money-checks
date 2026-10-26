import type { NativeAdCache } from "../lib/ads/nativeAdCache";
import { Feather } from "./AppIcons";
import { useEffect, useState } from "react";
import { Image, useWindowDimensions, StyleSheet, Text, View } from "react-native";
import {
  type NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from "react-native-google-mobile-ads";

import { NativeAdCardUi, NativeAdListConfig } from "../constants/ads";
import { AppColors } from "../constants/colors";
import { AppTextBreakProps } from "../constants/textLayout";
import { resolveNativeAdLayout } from "../lib/ads/nativeAdLayout";

type AppNativeAdCardProps = {
  slotIndex: number;
  cache: NativeAdCache<NativeAd>;
};

export function AppNativeAdCard({ slotIndex, cache }: AppNativeAdCardProps) {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  const { fontScale, width } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(width);
  const { stacked, reservedHeight } = resolveNativeAdLayout(Math.min(width, cardWidth), fontScale);
  useEffect(() => {
    let mounted = true;
    setNativeAd(null);
    const lease = cache.acquire(slotIndex);
    void lease.promise.then((ad) => { if (mounted) setNativeAd(ad); });
    return () => { mounted = false; lease.release(); };
  }, [cache, slotIndex]);

  const adViewStyle = [styles.nativeAdView, { minHeight: reservedHeight }];
  return (
    <View style={styles.card} onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}>
      {!nativeAd ? <View pointerEvents="none" style={adViewStyle} /> : (
      <NativeAdView nativeAd={nativeAd} style={adViewStyle}>
        <View style={styles.content}>
          <View style={[styles.detailsRow, stacked && styles.stackedDetails]}>
            {nativeAd.icon ? (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <View style={styles.iconFrame}>
                  <Image source={{ uri: nativeAd.icon.url }} style={styles.icon} />
                </View>
              </NativeAsset>
            ) : null}
            <View style={[styles.copyColumn, stacked && styles.stackedCopy]}>
              <View style={styles.mainCopy}>
                <View style={[styles.headlineBlock, stacked && styles.stackedHeadline]}>
                  <Text style={styles.sponsoredLabel}>{NativeAdListConfig.sponsoredLabel}</Text>
                  <NativeAsset assetType={NativeAssetType.HEADLINE}>
                    <Text {...AppTextBreakProps} style={[styles.headline, stacked && styles.stackedCopy]}>
                      {nativeAd.headline}
                    </Text>
                  </NativeAsset>
                </View>
                {nativeAd.body ? (
                  <NativeAsset assetType={NativeAssetType.BODY}>
                    <Text {...AppTextBreakProps} style={styles.body}>
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
                  style={[styles.callToAction, stacked && styles.stackedButton]}
                >
                  <Feather
                    color={AppColors.inverseText}
                    name="download"
                    size={NativeAdCardUi.callToActionIconSize}
                  />
                  <Text {...AppTextBreakProps} style={[styles.callToActionText, stacked && styles.stackedButtonText]}>
                    {nativeAd.callToAction}
                  </Text>
                </View>
              </NativeAsset>
            ) : null}
          </View>
        </View>
      </NativeAdView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stackedDetails: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  stackedCopy: { flex: 0 },
  stackedHeadline: { flexDirection: "column", alignItems: "stretch" },
  stackedButton: { alignSelf: "stretch" },
  stackedButtonText: { maxWidth: "100%" },
  nativeAdView: {
    backgroundColor: AppColors.adBackground,
    justifyContent: "center",
  },
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
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
    minHeight: NativeAdCardUi.callToActionIconButtonSize,
    justifyContent: "center",
    paddingHorizontal: NativeAdCardUi.callToActionPaddingHorizontal,
    paddingVertical: NativeAdCardUi.callToActionPaddingVertical,
  },
  callToActionText: {
    color: AppColors.inverseText,
    fontSize: NativeAdCardUi.callToActionTextFontSize,
    fontWeight: "700",
    maxWidth: NativeAdCardUi.callToActionTextMaxWidth,
    flexShrink: 1,
    lineHeight: NativeAdCardUi.callToActionLineHeight,
  },
});
