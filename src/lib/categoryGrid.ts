import {
  CATEGORY_GRID_GAP,
  CATEGORY_GRID_MIN_CELL_SIZE,
  CATEGORY_GRID_MIN_COLUMNS,
} from "../constants/categorySelector";

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
    return { cellSize: CATEGORY_GRID_MIN_CELL_SIZE, columns: CATEGORY_GRID_MIN_COLUMNS };
  }

  const columnCount = Math.max(
    Math.floor((width + CATEGORY_GRID_GAP) / (CATEGORY_GRID_MIN_CELL_SIZE + CATEGORY_GRID_GAP)),
    CATEGORY_GRID_MIN_COLUMNS,
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
