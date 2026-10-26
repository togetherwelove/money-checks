import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";

export function useDismissStartupSplash(isReady: boolean) {
  const [hasLayout, setHasLayout] = useState(false);
  const hasDismissed = useRef(false);
  const onLayout = useCallback(() => setHasLayout(true), []);

  useEffect(() => {
    if (!isReady || !hasLayout || hasDismissed.current) {
      return;
    }

    hasDismissed.current = true;
    void SplashScreen.hideAsync().catch(() => {
      // The native splash may already be unavailable in development.
    });
  }, [hasLayout, isReady]);

  return onLayout;
}
