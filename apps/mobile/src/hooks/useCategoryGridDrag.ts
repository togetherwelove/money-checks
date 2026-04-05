import { useEffect, useRef, useState } from "react";
import { Animated, Easing, type View } from "react-native";

import { CATEGORY_DRAG_ANIMATION_MS } from "../constants/categorySelector";
import {
  type CategoryGridBounds,
  resolveCategoryCellSize,
  resolveCategoryDropIndex,
  resolveCategoryGridHeight,
  resolveCategoryGridPosition,
  resolveDraggedCategoryPosition,
} from "../lib/categoryGrid";

type UseCategoryGridDragParams = {
  moveCategory: (fromIndex: number, toIndex: number) => void;
  orderedCategories: string[];
  saveCurrentOrder: () => void;
};

type UseCategoryGridDragResult = {
  cellSize: number;
  containerHeight: number;
  draggingCategory: string | null;
  getAnimatedPosition: (category: string) => Animated.ValueXY;
  handleContainerLayout: (view: View | null, width: number) => void;
  handleDragEnd: (category: string) => void;
  handleDragMove: (category: string, pageX: number, pageY: number) => void;
  handleDragStart: (category: string, pageX: number, pageY: number) => void;
};

export function useCategoryGridDrag({
  moveCategory,
  orderedCategories,
  saveCurrentOrder,
}: UseCategoryGridDragParams): UseCategoryGridDragResult {
  const [containerBounds, setContainerBounds] = useState<CategoryGridBounds>({
    left: 0,
    top: 0,
    width: 0,
  });
  const [draggingCategory, setDraggingCategory] = useState<string | null>(null);
  const animatedPositionsRef = useRef<Record<string, Animated.ValueXY>>({});
  const draggingCategoryRef = useRef<string | null>(null);
  const orderedCategoriesRef = useRef(orderedCategories);
  const cellSize = resolveCategoryCellSize(containerBounds.width);

  useEffect(() => {
    orderedCategoriesRef.current = orderedCategories;
  }, [orderedCategories]);

  useEffect(() => {
    for (const [index, category] of orderedCategories.entries()) {
      const nextPosition = resolveCategoryGridPosition(index, cellSize);
      const animatedPosition = getAnimatedPositionValue(
        animatedPositionsRef.current,
        category,
        nextPosition,
      );

      if (draggingCategoryRef.current === category) {
        continue;
      }

      Animated.timing(animatedPosition, {
        duration: CATEGORY_DRAG_ANIMATION_MS,
        easing: Easing.out(Easing.quad),
        toValue: nextPosition,
        useNativeDriver: false,
      }).start();
    }
  }, [cellSize, orderedCategories]);

  return {
    cellSize,
    containerHeight: resolveCategoryGridHeight(orderedCategories.length, cellSize),
    draggingCategory,
    getAnimatedPosition: (category) =>
      getAnimatedPositionValue(
        animatedPositionsRef.current,
        category,
        resolveCategoryGridPosition(orderedCategories.indexOf(category), cellSize),
      ),
    handleContainerLayout: (view, width) => {
      if (!view) {
        return;
      }

      view.measureInWindow((left, top) => {
        setContainerBounds({ left, top, width });
      });
    },
    handleDragEnd: (category) => {
      if (draggingCategoryRef.current !== category) {
        return;
      }

      const finalIndex = orderedCategoriesRef.current.indexOf(category);
      const finalPosition = resolveCategoryGridPosition(finalIndex, cellSize);
      const animatedPosition = getAnimatedPositionValue(
        animatedPositionsRef.current,
        category,
        finalPosition,
      );

      Animated.timing(animatedPosition, {
        duration: CATEGORY_DRAG_ANIMATION_MS,
        easing: Easing.out(Easing.quad),
        toValue: finalPosition,
        useNativeDriver: false,
      }).start(() => {
        draggingCategoryRef.current = null;
        setDraggingCategory(null);
        saveCurrentOrder();
      });
    },
    handleDragMove: (category, pageX, pageY) => {
      if (draggingCategoryRef.current !== category || cellSize <= 0) {
        return;
      }

      const animatedPosition = getAnimatedPositionValue(
        animatedPositionsRef.current,
        category,
        resolveDraggedCategoryPosition(pageX, pageY, containerBounds, cellSize),
      );
      const nextPosition = resolveDraggedCategoryPosition(pageX, pageY, containerBounds, cellSize);
      animatedPosition.setValue(nextPosition);

      const fromIndex = orderedCategoriesRef.current.indexOf(category);
      const toIndex = resolveCategoryDropIndex(
        pageX,
        pageY,
        containerBounds,
        cellSize,
        orderedCategoriesRef.current.length,
      );

      if (fromIndex !== toIndex) {
        moveCategory(fromIndex, toIndex);
      }
    },
    handleDragStart: (category, pageX, pageY) => {
      if (cellSize <= 0) {
        return;
      }

      draggingCategoryRef.current = category;
      setDraggingCategory(category);

      const animatedPosition = getAnimatedPositionValue(
        animatedPositionsRef.current,
        category,
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
