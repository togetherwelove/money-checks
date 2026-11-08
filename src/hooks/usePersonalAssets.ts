import { useCallback, useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { AppState } from "react-native";
import { AssetCopy } from "../constants/assets";
import { fetchPersonalAssets } from "../lib/personalAssets";
import type { AssetPortfolio } from "../types/asset";

const emptyPortfolio: AssetPortfolio = { assets: [], valuations: [] };

export function usePersonalAssets(bookId: string) {
  const focused = useIsFocused();
  const [snapshot, setSnapshot] = useState({ bookId, portfolio: emptyPortfolio });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const portfolio = await fetchPersonalAssets(bookId);
      if (request === generation.current) setSnapshot({ bookId, portfolio });
    } catch {
      if (request === generation.current) setError(AssetCopy.loadError);
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [bookId]);
  useEffect(() => {
    if (!focused) return;
    void refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      generation.current++;
      subscription.remove();
    };
  }, [focused, refresh]);
  return {
    portfolio: snapshot.bookId === bookId ? snapshot.portfolio : emptyPortfolio,
    loading,
    error,
    refresh,
  };
}
