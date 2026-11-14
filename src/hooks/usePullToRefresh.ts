import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { logAppError } from "../lib/logAppError";

/** Native refresh UI belongs only to the user's pull gesture, not background data loading. */
export function usePullToRefresh(onRefresh: () => Promise<void>, resetKey: unknown) {
  const focused = useIsFocused();
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const revisionRef = useRef(0);

  useEffect(() => {
    refreshingRef.current = false;
    setIsPullRefreshing(false);
    return () => {
      revisionRef.current += 1;
      refreshingRef.current = false;
    };
  }, [resetKey, focused]);

  const onPullRefresh = useCallback(async () => {
    if (!focused || refreshingRef.current) return;
    refreshingRef.current = true;
    const revision = ++revisionRef.current;
    setIsPullRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      logAppError("PullToRefresh", error);
    } finally {
      if (revision === revisionRef.current) {
        refreshingRef.current = false;
        setIsPullRefreshing(false);
      }
    }
  }, [focused, onRefresh]);

  return { isPullRefreshing, onPullRefresh };
}
