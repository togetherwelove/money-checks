const EXIT_INTENT_TTL_MS = 15_000;

type ExitIntentRecord = {
  timeoutId: ReturnType<typeof setTimeout>;
};

const exitIntentByKey = new Map<string, ExitIntentRecord>();

export function markSharedLedgerExitIntent(userId: string, bookId: string): void {
  const intentKey = getExitIntentKey(userId, bookId);
  clearSharedLedgerExitIntent(userId, bookId);

  const timeoutId = setTimeout(() => {
    exitIntentByKey.delete(intentKey);
  }, EXIT_INTENT_TTL_MS);

  exitIntentByKey.set(intentKey, { timeoutId });
}

export function consumeSharedLedgerExitIntent(userId: string, bookId: string): boolean {
  const intentKey = getExitIntentKey(userId, bookId);
  const existingIntent = exitIntentByKey.get(intentKey);
  if (!existingIntent) {
    return false;
  }

  clearTimeout(existingIntent.timeoutId);
  exitIntentByKey.delete(intentKey);
  return true;
}

export function clearSharedLedgerExitIntent(userId: string, bookId: string): void {
  const intentKey = getExitIntentKey(userId, bookId);
  const existingIntent = exitIntentByKey.get(intentKey);
  if (!existingIntent) {
    return;
  }

  clearTimeout(existingIntent.timeoutId);
  exitIntentByKey.delete(intentKey);
}

function getExitIntentKey(userId: string, bookId: string): string {
  return `${userId}:${bookId}`;
}
