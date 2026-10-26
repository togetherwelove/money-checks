import { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { NativeAd, NativeAdChoicesPlacement, TestIds } from "react-native-google-mobile-ads";
import { AdMobNativeConfig } from "../constants/ads";
import { NativeAdCacheConfig as Config } from "../constants/nativeAdCache";
import { NativeAdCache } from "../lib/ads/nativeAdCache";
import { resolveAdMobAdUnitId } from "../lib/ads/adUnitId";
import { getAdRequestOptions } from "../lib/ads/adRequestOptions";
import { logAppError } from "../lib/logAppError";

export function useNativeAdCache(enabled: boolean) {
  const cache = useMemo(() => new NativeAdCache<NativeAd>(async (slotIndex) => {
    const unitId = resolveAdMobAdUnitId(AdMobNativeConfig, TestIds.NATIVE);
    if (!unitId) return null;
    try {
      return await NativeAd.createForAdRequest(unitId, {
        ...getAdRequestOptions(), adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
      });
    } catch (error) {
      logAppError("AdMob", error, { platform: Platform.OS, slotIndex, step: "load_native_ad", unitId });
      return null;
    }
  }, Config.maxIdleAds, Config.lifetimeMs, Config.retryMs), [enabled]);
  useEffect(() => () => cache.dispose(), [cache]);
  return cache;
}
