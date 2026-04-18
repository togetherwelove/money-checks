import type { AdInterstitialPlacementKey } from "../../constants/ads";

export function preloadInterstitialAd() {}

export async function showInterstitialAd(_placement: AdInterstitialPlacementKey): Promise<boolean> {
  return false;
}
