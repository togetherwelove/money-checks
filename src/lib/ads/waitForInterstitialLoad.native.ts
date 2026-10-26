import { AdEventType, type InterstitialAd } from "react-native-google-mobile-ads";

import { InterstitialAdTiming } from "../../constants/ads";

export function waitForInterstitialLoad(ad: InterstitialAd): Promise<boolean> {
  return new Promise(resolve => {
    const finish = (loaded: boolean) => {
      clearTimeout(timer);
      removeLoaded();
      removeError();
      resolve(loaded);
    };
    const removeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => finish(true));
    const removeError = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));
    const timer = setTimeout(() => finish(false), InterstitialAdTiming.loadTimeoutMs);
  });
}
