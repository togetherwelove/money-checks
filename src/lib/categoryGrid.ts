import {
  CATEGORY_DRAG_SCALE,
  CATEGORY_GRID_GAP,
  CATEGORY_GRID_MAX_COLUMNS,
  CATEGORY_GRID_MIN_CELL_SIZE,
  CATEGORY_GRID_MIN_COLUMNS,
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

export type CategoryGridMetrics = {
  cellSize: number;
  columns: number;
};

export function resolveCategoryGridMetrics(width: number): CategoryGridMetrics {
  if (width <= 0) {
    return { cellSize: 0, columns: CATEGORY_GRID_MIN_COLUMNS };
  }

  const columnCount = clampValue(
    Math.floor((width + CATEGORY_GRID_GAP) / (CATEGORY_GRID_MIN_CELL_SIZE + CATEGORY_GRID_GAP)),
    CATEGORY_GRID_MIN_COLUMNS,
    CATEGORY_GRID_MAX_COLUMNS,
  );

  return {
    cellSize: (width - CATEGORY_GRID_GAP * (columnCount - 1)) / columnCount,
    columns: columnCount,
  };
}

export function resolveCategoryGridHeight(
  itemCount: number,
  cellSize: number,
  columns: number,
): number {
  if (itemCount <= 0 || cellSize <= 0 || columns <= 0) {
    return 0;
  }

  const rowCount = Math.ceil(itemCount / columns);
  return rowCount * cellSize + Math.max(0, rowCount - 1) * CATEGORY_GRID_GAP;
}

export function resolveCategoryGridPosition(
  index: number,
  cellSize: number,
  columns: number,
): CategoryGridPosition {
  const rowIndex = Math.floor(index / columns);
  const columnIndex = index % columns;

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
  columns: number,
  itemCount: number,
): number {
  if (cellSize <= 0 || columns <= 0 || itemCount <= 0) {
    return 0;
  }

  const localX = clampValue(pageX - bounds.left, 0, Math.max(bounds.width - 1, 0));
  const gridHeight = resolveCategoryGridHeight(itemCount, cellSize, columns);
  const localY = clampValue(pageY - bounds.top, 0, Math.max(gridHeight - 1, 0));
  const columnIndex = clampValue(
    Math.floor(localX / (cellSize + CATEGORY_GRID_GAP)),
    0,
    columns - 1,
  );
  const rowIndex = Math.floor(localY / (cellSize + CATEGORY_GRID_GAP));
  const nextIndex = rowIndex * columns + columnIndex;

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
