import { logAppError, logAppWarning } from "../logAppError";

type AdMobLoadErrorContext = Record<string, unknown>;

const DEV_ADMOB_LOAD_WARNING = "Ad load failed in development";

export function logAdMobLoadError(scope: string, error: unknown, context: AdMobLoadErrorContext) {
  if (__DEV__) {
    logAppWarning(scope, DEV_ADMOB_LOAD_WARNING, {
      ...context,
      error,
    });
    return;
  }

  logAppError(scope, error, context);
}
