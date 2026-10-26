export function createScopedClipboardReader<T>() {
  let pending: { scope: string; request: Promise<T> } | null = null;
  return (scope: string, read: () => Promise<T>): Promise<T> => {
    if (pending?.scope === scope) return pending.request;
    const request = Promise.resolve().then(read).finally(() => {
      if (pending?.request === request) pending = null;
    });
    pending = { scope, request };
    return request;
  };
}
