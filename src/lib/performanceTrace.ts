type PerformanceTraceContext = Record<string, unknown>;

export function createPerformanceTrace(scope: string, context?: PerformanceTraceContext) {
  const startedAt = Date.now();

  return (step: string, nextContext?: PerformanceTraceContext) => {
    if (!__DEV__) {
      return;
    }

    console.info(`[${scope}] ${step}`, {
      ...context,
      ...nextContext,
      elapsedMs: Date.now() - startedAt,
    });
  };
}
