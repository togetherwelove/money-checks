import { useCallback, useEffect, useRef } from "react";
import { AccessibilityInfo, type LayoutChangeEvent } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { EntryListScrollUi } from "../constants/scroll";

type AppendScrollable = {
  scrollToEnd: (options: { animated: boolean }) => void;
  scrollTo?: (options: { y: number; animated: boolean }) => void;
  scrollToOffset?: (options: { offset: number; animated: boolean }) => void;
};

export function useEntryAppendScroll<T extends AppendScrollable>(
  scope: string | null,
  isLoading: boolean,
  entryCount: number,
) {
  const ref = useRef<T | null>(null);
  const focused = useIsFocused();
  const ready = useRef(false);
  ready.current = focused && !isLoading && entryCount > 0;
  const pending = useRef(true);
  const size = useRef({ viewport: 0, content: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useRef(false);
  const suppressPagination = useRef(false);

  const cancel = useCallback(() => {
    pending.current = false;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const revealAppend = useCallback(() => {
    if (
      !pending.current ||
      !ready.current ||
      timer.current !== null ||
      size.current.viewport <= 0 ||
      size.current.content <= 0
    )
      return;
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!pending.current || !ready.current) return;
      pending.current = false;
      if (size.current.content <= size.current.viewport) return;
      suppressPagination.current = true;
      ref.current?.scrollToEnd({ animated: !reduceMotion.current });
    }, EntryListScrollUi.firstEntryPreviewMs);
  }, []);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (active) reduceMotion.current = value;
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    cancel();
    pending.current = focused;
    suppressPagination.current = false;
    if (focused) {
      ref.current?.scrollTo?.({ y: 0, animated: false });
      ref.current?.scrollToOffset?.({ offset: 0, animated: false });
      revealAppend();
    }
    return cancel;
  }, [scope, focused, cancel, revealAppend]);

  useEffect(() => {
    revealAppend();
  }, [isLoading, entryCount, revealAppend]);

  return {
    ref,
    suppressPagination,
    onLayout: (event: LayoutChangeEvent) => {
      size.current.viewport = event.nativeEvent.layout.height;
      revealAppend();
    },
    onContentSizeChange: (_width: number, height: number) => {
      size.current.content = height;
      revealAppend();
    },
    onScrollBeginDrag: () => {
      suppressPagination.current = false;
      cancel();
    },
    onTouchStart: cancel,
  };
}
