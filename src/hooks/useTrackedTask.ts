import { useCallback, useState } from "react";

export function useTrackedTask() {
  const [taskCount, setTaskCount] = useState(0);
  const trackTask = useCallback(async function trackTask<T>(task: () => Promise<T>): Promise<T> {
    setTaskCount((count) => count + 1);
    try {
      return await task();
    } finally {
      setTaskCount((count) => Math.max(0, count - 1));
    }
  }, []);

  return { taskCount, trackTask };
}
