export const KeyboardLayout = {
  dismissMode: {
    android: "on-drag" as const,
    ios: "interactive" as const,
  },
  focusedInputExtraScrollHeightMax: 96,
  focusedInputExtraScrollHeightMin: 16,
  focusedInputExtraScrollHeightRatio: 0.5,
  persistTaps: "handled" as const,
} as const;
