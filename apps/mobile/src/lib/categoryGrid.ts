import {
  CATEGORY_DRAG_SCALE,
  CATEGORY_GRID_COLUMNS,
  CATEGORY_GRID_GAP,
} from "../constants/categorySelector";

export type CategoryGridBounds = {
  left: number;
  top: number;
  width: number;
};

export type CategoryGridPosition = {
  x: number;
  y: number;
};

export function resolveCategoryCellSize(width: number): number {
  if (width <= 0) {
    return 0;
  }

  return (width - CATEGORY_GRID_GAP * (CATEGORY_GRID_COLUMNS - 1)) / CATEGORY_GRID_COLUMNS;
}

export function resolveCategoryGridHeight(itemCount: number, cellSize: number): number {
  if (itemCount <= 0 || cellSize <= 0) {
    return 0;
  }

  const rowCount = Math.ceil(itemCount / CATEGORY_GRID_COLUMNS);
  return rowCount * cellSize + Math.max(0, rowCount - 1) * CATEGORY_GRID_GAP;
}

export function resolveCategoryGridPosition(index: number, cellSize: number): CategoryGridPosition {
  const rowIndex = Math.floor(index / CATEGORY_GRID_COLUMNS);
  const columnIndex = index % CATEGORY_GRID_COLUMNS;

  return {
    x: columnIndex * (cellSize + CATEGORY_GRID_GAP),
    y: rowIndex * (cellSize + CATEGORY_GRID_GAP),
  };
}

export function resolveCategoryDropIndex(
  pageX: number,
  pageY: number,
  bounds: CategoryGridBounds,
  cellSize: number,
  itemCount: number,
): number {
  if (cellSize <= 0 || itemCount <= 0) {
    return 0;
  }

  const localX = clampValue(pageX - bounds.left, 0, Math.max(bounds.width - 1, 0));
  const gridHeight = resolveCategoryGridHeight(itemCount, cellSize);
  const localY = clampValue(pageY - bounds.top, 0, Math.max(gridHeight - 1, 0));
  const columnIndex = clampValue(
    Math.floor(localX / (cellSize + CATEGORY_GRID_GAP)),
    0,
    CATEGORY_GRID_COLUMNS - 1,
  );
  const rowIndex = Math.floor(localY / (cellSize + CATEGORY_GRID_GAP));
  const nextIndex = rowIndex * CATEGORY_GRID_COLUMNS + columnIndex;

  return clampValue(nextIndex, 0, itemCount - 1);
}

export function resolveDraggedCategoryPosition(
  pageX: number,
  pageY: number,
  bounds: CategoryGridBounds,
  cellSize: number,
): CategoryGridPosition {
  return {
    x: pageX - bounds.left - cellSize / 2,
    y: pageY - bounds.top - cellSize / 2,
  };
}

export function resolveDraggedCategoryScale(isDragging: boolean): number {
  return isDragging ? CATEGORY_DRAG_SCALE : 1;
}

function clampValue(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
