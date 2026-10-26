export const AuthStorageConfig = {
  chunkLength: 1500,
  chunkPrefix: "__chunks__:",
  chunkSeparator: "__chunk__",
  accessRetryDelayMs: 250,
  accessRetryLimit: 3,
  interactionNotAllowedMessage: "User interaction is not allowed",
} as const;
