import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { useReducedMotion } from "react-native-reanimated";

import { AllEntriesFilterUi } from "../constants/allEntries";

export function useFilterSheetAnimation(onClose: () => void, windowHeight: number) {
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const dragOffset = useRef(new Animated.Value(0)).current;
  const dragStartOffsetRef = useRef(0);
  const dragAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const closingRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => () => {
    animationRef.current?.stop();
    dragAnimationRef.current?.stop();
  }, []);

  const open = useCallback(() => {
    if (closingRef.current) return;
    animationRef.current?.stop();
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: reduceMotion ? 0 : AllEntriesFilterUi.filterSheetOpenDurationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animationRef.current.start();
  }, [progress, reduceMotion]);

  const close = useCallback((afterClose?: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsClosing(true);
    animationRef.current?.stop();
    dragAnimationRef.current?.stop();
    animationRef.current = Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion ? 0 : AllEntriesFilterUi.filterSheetCloseDurationMs,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animationRef.current.start(({ finished }) => {
      if (!finished) return;
      afterClose?.();
      onClose();
    });
  }, [onClose, progress, reduceMotion]);

  const restoreDrag = useCallback(() => {
    if (closingRef.current) return;
    dragAnimationRef.current = Animated.timing(dragOffset, {
      toValue: 0,
      duration: reduceMotion ? 0 : AllEntriesFilterUi.filterSheetCloseDurationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    dragAnimationRef.current.start();
  }, [dragOffset, reduceMotion]);

  const handleGesture = useMemo(() => Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY(AllEntriesFilterUi.filterSheetDragActivationDistance)
    .onStart(() => {
      dragAnimationRef.current?.stop();
      dragOffset.stopAnimation((value) => { dragStartOffsetRef.current = value; });
    })
    .onUpdate((event) => {
      if (!closingRef.current) {
        dragOffset.setValue(Math.max(0, dragStartOffsetRef.current + event.translationY));
      }
    })
    .onEnd((event) => {
      const distance = Math.max(0, dragStartOffsetRef.current + event.translationY);
      if (
        distance >= AllEntriesFilterUi.filterSheetDragCloseDistance ||
        (event.translationY > AllEntriesFilterUi.filterSheetDragActivationDistance &&
          event.velocityY >= AllEntriesFilterUi.filterSheetDragCloseVelocity)
      ) {
        close();
      } else {
        restoreDrag();
      }
    })
    .onFinalize((_event, success) => {
      if (!success) restoreDrag();
    }), [close, dragOffset, restoreDrag]);

  return {
    open,
    close,
    isClosing,
    handleGesture,
    backdropStyle: { opacity: progress },
    sheetStyle: {
      transform: [{ translateY: Animated.add(
        progress.interpolate({ inputRange: [0, 1], outputRange: [windowHeight, 0] }),
        dragOffset,
      ) }],
    },
  };
}
