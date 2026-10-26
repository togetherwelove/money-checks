import { HomeScreenUi } from "./home";

export const ResponsiveLayout = {
  splitViewMinWidth: 760,
  workspaceMaxWidth: 1440,
  paneGap: 16,
  minimumTransactionViewport: HomeScreenUi.transactionMinimumHeight,
} as const;

export function resolveHomeLayout(width: number, height: number, calendarHeight: number, bottomInset: number) {
  const split = width >= ResponsiveLayout.splitViewMinWidth;
  return {
    split,
    scrollCalendarWithEntries: !split && height > 0 &&
      calendarHeight + bottomInset + ResponsiveLayout.minimumTransactionViewport > height,
  };
}
