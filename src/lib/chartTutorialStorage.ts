import { ChartTutorialStorage } from "../constants/chartScreen";
import { appStorage } from "./appStorage";

export function hasSeenChartSwipeTutorial(userId: string): boolean {
  return appStorage.getItem(createChartSwipeTutorialKey(userId)) === "true";
}

export function markChartSwipeTutorialSeen(userId: string): void {
  appStorage.setItem(createChartSwipeTutorialKey(userId), "true");
}

function createChartSwipeTutorialKey(userId: string): string {
  return `${ChartTutorialStorage.swipeHintKeyPrefix}.${userId}`;
}
