import { useEffect, useRef, useState } from "react";
import { Animated, Easing, type View } from "react-native";

import { CATEGORY_DRAG_ANIMATION_MS } from "../constants/categorySelector";
import {
  type CategoryGridBounds,
  resolveCategoryDropIndex,
  resolveCategoryGridHeight,
  resolveCategoryGridMetrics,
  resolveCategoryGridPosition,
  resolveDraggedCategoryPosition,
} from "../lib/categoryGrid";
import { resolvePreviewCategoryOrder } from "../lib/categoryOrder";
import type { CategoryDefinition } from "../types/category";

type UseCategoryGridDragParams = {
  onDraggingChange?: (isDragging: boolean) => void;
  orderedCategories: CategoryDefinition[];
  replaceOrderedCategories: (nextCategories: CategoryDefinition[]) => void;
  saveCurrentOrder: () => void;
};

type UseCategoryGridDragResult = {
  cellSize: number;
  columns: number;
  containerHeight: number;
  draggingCategoryId: string | null;
  getAnimatedPosition: (categoryId: string) => Animated.ValueXY;
  handleContainerLayout: (view: View | null, width: number) => void;
  handleDragEnd: (categoryId: string) => void;
  handleDragMove: (categoryId: string, pageX: number, pageY: number) => void;
  handleDragStart: (categoryId: string, pageX: number, pageY: number) => void;
};

export function useCategoryGridDrag({
  onDraggingChange,
  orderedCategories,
  replaceOrderedCategories,
  saveCurrentOrder,
}: UseCategoryGridDragParams): UseCategoryGridDragResult {
  const [containerBounds, setContainerBounds] = useState<CategoryGridBounds>({
    left: 0,
    top: 0,
    width: 0,
  });
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const animatedPositionsRef = useRef<Record<string, Animated.ValueXY>>({});
  const draggingCategoryIdRef = useRef<string | null>(null);
  const dragStartOrderRef = useRef<CategoryDefinition[]>([]);
  const dragTargetIndexRef = useRef<number | null>(null);
  const orderedCategoriesRef = useRef(orderedCategories);
  const gridMetrics = resolveCategoryGridMetrics(containerBounds.width);
  const { cellSize, columns } = gridMetrics;

  useEffect(() => {
    orderedCategoriesRef.current = orderedCategories;
  }, [orderedCategories]);

  useEffect(() => {
    for (const [index, category] of orderedCategories.entries()) {
      const nextPosition = resolveCategoryGridPosition(index, cellSize, columns);
      const animatedPosition = getAnimatedPositionValue(
        animatedPositionsRef.current,
        category.id,
        nextPosition,
      );

      if (draggingCategoryIdRef.current === category.id) {
        continue;
      }

      Animated.timing(animatedPosition, {
        duration: CATEGORY_DRAG_ANIMATION_MS,
        easing: Easing.out(Easing.quad),
        toValue: nextPosition,
        useNativeDriver: false,
      }).start();
    }
  }, [cellSize, columns, orderedCategories]);

  return {
    cellSize,
    columns,
    containerHeight: resolveCategoryGridHeight(orderedCategories.length, cellSize, columns),
    draggingCategoryId,
    getAnimatedPosition: (categoryId) =>
      getAnimatedPositionValue(
        animatedPositionsRef.current,
        categoryId,
        resolveCategoryGridPosition(
          orderedCategories.findIndex((category) => category.id === categoryId),
          cellSize,
          columns,
        ),
      ),
    handleContainerLayout: (view, width) => {
      if (!view) {
        return;
      }

      view.measureInWindow((left, top) => {
        setContainerBounds({ left, top, width });
      });
    },
    handleDragEnd: (categoryId) => {
      if (draggingCategoryIdRef.current !== categoryId) {
        return;
      }

      const finalIndex = orderedCategoriesRef.current.findIndex(
        (category) => category.id === categoryId,
      );
      const finalPosition = resolveCategoryGridPosition(finalIndex, cellSize, columns);
      const animatedPosition = getAnimatedPositionValue(
        animatedPositionsRef.current,
        categoryId,
        finalPosition,
      );

      Animated.timing(animatedPosition, {
        duration: CATEGORY_DRAG_ANIMATION_MS,
        easing: Easing.out(Easing.quad),
        toValue: finalPosition,
        useNativeDriver: false,
      }).start(() => {
        draggingCategoryIdRef.current = null;
        dragStartOrderRef.current = [];
        dragTargetIndexRef.current = null;
        setDraggingCategoryId(null);
        onDraggingChange?.(false);
        saveCurrentOrder();
      });
    },
    handleDragMove: (categoryId, pageX, pageY) => {
      if (draggingCategoryIdRef.current !== categoryId || cellSize <= 0) {
        return;
      }

      const animatedPosition = getAnimatedPositionValue(
        animatedPositionsRef.current,
        categoryId,
        resolveDraggedCategoryPosition(pageX, pageY, containerBounds, cellSize),
      );
      const nextPosition = resolveDraggedCategoryPosition(pageX, pageY, containerBounds, cellSize);
      animatedPosition.setValue(nextPosition);

      const toIndex = resolveCategoryDropIndex(
        pageX,
        pageY,
        containerBounds,
        cellSize,
        columns,
        orderedCategoriesRef.current.length,
      );

      if (dragTargetIndexRef.current === toIndex) {
        return;
      }

      dragTargetIndexRef.current = toIndex;
      replaceOrderedCategories(
        resolvePreviewCategoryOrder(dragStartOrderRef.current, categoryId, toIndex),
      );
    },
    handleDragStart: (categoryId, pageX, pageY) => {
      if (cellSize <= 0) {
        return;
      }

      draggingCategoryIdRef.current = categoryId;
      dragStartOrderRef.current = [...orderedCategoriesRef.current];
      dragTargetIndexRef.current = dragStartOrderRef.current.findIndex(
        (category) => category.id === categoryId,
      );
      setDraggingCategoryId(categoryId);
      onDraggingChange?.(true);

      const animatedPosition = getAnimatedPositionValue(
        animatedPositionsRef.current,
        categoryId,
        resolveDraggedCategoryPosition(pageX, pageY, containerBounds, cellSize),
      );
      animatedPosition.setValue(
        resolveDraggedCategoryPosition(pageX, pageY, containerBounds, cellSize),
      );
    },
  };
}

function getAnimatedPositionValue(
  animatedPositions: Record<string, Animated.ValueXY>,
  category: string,
  initialPosition: { x: number; y: number },
): Animated.ValueXY {
  if (!animatedPositions[category]) {
    animatedPositions[category] = new Animated.ValueXY(initialPosition);
  }

  return animatedPositions[category];
}
