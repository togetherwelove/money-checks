import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { fetchPersonalAssets } from "../lib/personalAssets";
import type { AssetPortfolio } from "../types/asset";

const empty: AssetPortfolio = { assets: [], valuations: [], movements: [] };
export function useAssetLinkOptions(bookId?: string, enabled = true) {
  const [snapshot, setSnapshot] = useState({ bookId, portfolio: empty });
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!bookId || !enabled) return;
    let active = true;
    setError(false);
    void fetchPersonalAssets(bookId)
      .then((portfolio) => {
        if (active) setSnapshot({ bookId, portfolio });
      })
      .catch(() => {
        if (active) setError(true);
      });
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") retry();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [bookId, enabled, revision, retry]);
  return { portfolio: snapshot.bookId === bookId ? snapshot.portfolio : empty, error, retry };
}
