import type { ScrollViewProps } from "react-native";

export const AppScrollBehavior = {
  bounces: false,
  alwaysBounceHorizontal: false,
  alwaysBounceVertical: false,
  overScrollMode: "never",
} as const satisfies ScrollViewProps;

export const AppPagerScrollBehavior = {
  overdrag: false,
  overScrollMode: "never",
} as const;

export const RefreshableScrollBehavior = {
  ...AppScrollBehavior,
  bounces: true,
  alwaysBounceVertical: true,
} as const satisfies ScrollViewProps;
