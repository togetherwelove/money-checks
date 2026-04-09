export const KeyboardLayout = {
  bottomInset: 24,
  dismissMode: {
    android: "on-drag" as const,
    ios: "interactive" as const,
  },
  persistTaps: "handled" as const,
} as const;
