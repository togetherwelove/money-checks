import { StartupCheck, StartupCopy } from "../constants/startup";

export async function runStartupCheck<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel = () => {};
  try {
    return await new Promise<T>((resolve, reject) => {
      cancel = () => {
        reject(new Error(StartupCopy.failed));
        controller.abort();
      };
      if (signal.aborted) {
        cancel();
        return;
      }
      signal.addEventListener("abort", cancel, { once: true });
      timer = setTimeout(() => {
        reject(new Error(StartupCopy.timedOut));
        controller.abort();
      }, StartupCheck.timeoutMs);
      Promise.resolve().then(() => operation(controller.signal)).then(resolve, reject);
    });
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}

export function startupErrorMessage(error: unknown): string {
  return error instanceof Error && error.message === StartupCopy.timedOut
    ? StartupCopy.timedOut
    : StartupCopy.failed;
}
