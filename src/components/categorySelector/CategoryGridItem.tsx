import { Feather } from "@expo/vector-icons";
import { useMemo, useRef } from "react";
import {
  Animated,
  PanResponder,
  type PanResponderGestureState,
  StyleSheet,
  Text,
} from "react-native";

import {
  CATEGORY_DRAG_LONG_PRESS_MS,
  CATEGORY_DRAG_START_THRESHOLD,
  CATEGORY_ICON_LABEL_GAP,
  CATEGORY_ICON_SIZE,
} from "../../constants/categorySelector";
import { AppColors } from "../../constants/colors";
import { resolveDraggedCategoryScale } from "../../lib/categoryGrid";
import type { CategoryDefinition } from "../../types/category";

type CategoryGridItemProps = {
  animatedPosition: Animated.ValueXY;
  category: CategoryDefinition;
  cellSize: number;
  isActive: boolean;
  isDragging: boolean;
  onDragEnd: (categoryId: string) => void;
  onDragMove: (categoryId: string, pageX: number, pageY: number) => void;
  onDragStart: (categoryId: string, pageX: number, pageY: number) => void;
  onPressCategory: (category: CategoryDefinition) => void;
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
  const iconName = category.iconName;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => false,
        onPanResponderGrant: (_event, gestureState) => {
          hasDraggedRef.current = false;
          dragTimerRef.current = setTimeout(() => {
            hasDraggedRef.current = true;
            onDragStart(category.id, gestureState.x0, gestureState.y0);
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

          onDragMove(category.id, gestureState.moveX, gestureState.moveY);
        },
        onPanResponderRelease: (_event, gestureState) => {
          clearDragTimer(dragTimerRef.current);
          dragTimerRef.current = null;

          if (hasDraggedRef.current) {
            onDragEnd(category.id);
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
            onDragEnd(category.id);
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
      <Feather
        color={isActive ? AppColors.primary : AppColors.mutedText}
        name={iconName}
        size={CATEGORY_ICON_SIZE}
      />
      <Text style={[styles.optionText, isActive && styles.activeOptionText]}>{category.label}</Text>
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
    gap: CATEGORY_ICON_LABEL_GAP,
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
