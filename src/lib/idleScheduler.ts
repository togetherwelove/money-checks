import { IdleSchedulerTiming } from "../constants/idleScheduler";

type IdleTask = {
  cancel: () => void;
};

type RequestIdleCallback = (callback: () => void) => number;
type CancelIdleCallback = (handle: number) => void;

type IdleCallbackGlobal = typeof globalThis & {
  cancelIdleCallback?: CancelIdleCallback;
  requestIdleCallback?: RequestIdleCallback;
};

export function scheduleIdleTask(callback: () => void): IdleTask {
  let isCancelled = false;
  const runCallback = () => {
    if (!isCancelled) {
      callback();
    }
  };
  const idleCallbackGlobal = globalThis as IdleCallbackGlobal;

  if (typeof idleCallbackGlobal.requestIdleCallback === "function") {
    const idleTaskId = idleCallbackGlobal.requestIdleCallback(runCallback);
    return {
      cancel: () => {
        isCancelled = true;
        idleCallbackGlobal.cancelIdleCallback?.(idleTaskId);
      },
    };
  }

  const timerId = setTimeout(runCallback, IdleSchedulerTiming.fallbackDelayMs);
  return {
    cancel: () => {
      isCancelled = true;
      clearTimeout(timerId);
    },
  };
}
