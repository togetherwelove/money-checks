import { useMemo, useRef } from "react";
import {
  Animated,
  type GestureResponderEvent,
  PanResponder,
  type PanResponderGestureState,
  StyleSheet,
  Text,
} from "react-native";

import {
  CATEGORY_DRAG_LONG_PRESS_MS,
  CATEGORY_DRAG_START_THRESHOLD,
} from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";
import { resolveDraggedCategoryScale } from "../../lib/categoryGrid";

type CategoryGridItemProps = {
  animatedPosition: Animated.ValueXY;
  category: string;
  cellSize: number;
  isActive: boolean;
  isDragging: boolean;
  onDragEnd: (category: string) => void;
  onDragMove: (category: string, pageX: number, pageY: number) => void;
  onDragStart: (category: string, pageX: number, pageY: number) => void;
  onPressCategory: (category: string) => void;
};

export function CategoryGridItem({
  animatedPosition,
  category,
  cellSize,
  isActive,
  isDragging,
  onDragEnd,
  onDragMove,
  onDragStart,
  onPressCategory,
}: CategoryGridItemProps) {
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDraggedRef = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => false,
        onPanResponderGrant: (_event, gestureState) => {
          hasDraggedRef.current = false;
          dragTimerRef.current = setTimeout(() => {
            hasDraggedRef.current = true;
            onDragStart(category, gestureState.x0, gestureState.y0);
          }, CATEGORY_DRAG_LONG_PRESS_MS);
        },
        onPanResponderMove: (_event, gestureState) => {
          if (!hasDraggedRef.current) {
            if (resolveMovementDistance(gestureState) > CATEGORY_DRAG_START_THRESHOLD) {
              clearDragTimer(dragTimerRef.current);
              dragTimerRef.current = null;
            }
            return;
          }

          onDragMove(category, gestureState.moveX, gestureState.moveY);
        },
        onPanResponderRelease: (_event, gestureState) => {
          clearDragTimer(dragTimerRef.current);
          dragTimerRef.current = null;

          if (hasDraggedRef.current) {
            onDragEnd(category);
            return;
          }

          if (resolveMovementDistance(gestureState) <= CATEGORY_DRAG_START_THRESHOLD) {
            onPressCategory(category);
          }
        },
        onPanResponderTerminate: () => {
          clearDragTimer(dragTimerRef.current);
          dragTimerRef.current = null;

          if (hasDraggedRef.current) {
            onDragEnd(category);
          }
        },
        onStartShouldSetPanResponder: () => true,
        onShouldBlockNativeResponder: () => true,
      }),
    [category, onDragEnd, onDragMove, onDragStart, onPressCategory],
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.option,
        isActive && styles.activeOption,
        isDragging && styles.draggingOption,
        {
          height: cellSize,
          transform: [
            { translateX: animatedPosition.x },
            { translateY: animatedPosition.y },
            { scale: resolveDraggedCategoryScale(isDragging) },
          ],
          width: cellSize,
          zIndex: isDragging ? 2 : 1,
        },
      ]}
    >
      <Text style={[styles.optionText, isActive && styles.activeOptionText]}>{category}</Text>
    </Animated.View>
  );
}

function clearDragTimer(timer: ReturnType<typeof setTimeout> | null) {
  if (timer) {
    clearTimeout(timer);
  }
}

function resolveMovementDistance(gestureState: PanResponderGestureState): number {
  return Math.max(Math.abs(gestureState.dx), Math.abs(gestureState.dy));
}

const styles = StyleSheet.create({
  option: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  activeOption: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceStrong,
  },
  activeOptionText: {
    color: AppColors.primary,
    fontWeight: "700",
  },
  draggingOption: {
    borderColor: AppColors.accent,
    backgroundColor: AppColors.accentSoft,
    shadowColor: AppColors.calendarShadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
});
