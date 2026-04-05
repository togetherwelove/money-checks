type AppErrorContext = Record<string, unknown>;

export function logAppError(scope: string, error: unknown, context?: AppErrorContext) {
  if (context) {
    console.error(`[${scope}]`, error, context);
    return;
  }

  console.error(`[${scope}]`, error);
}

export function logAppWarning(scope: string, message: string, context?: AppErrorContext) {
  if (context) {
    console.warn(`[${scope}] ${message}`, context);
    return;
  }

  console.warn(`[${scope}] ${message}`);
}
