const MIN_TRANSITION_DISTANCE = 40;
const MIN_TRANSITION_VELOCITY = 0.45;
const TRANSITION_THRESHOLD_RATIO = 0.2;

export function resolveMonthOffset(
  translationY: number,
  velocityY: number,
  calendarHeight: number,
): -1 | 0 | 1 {
  const threshold = Math.max(
    MIN_TRANSITION_DISTANCE,
    Math.min(calendarHeight * TRANSITION_THRESHOLD_RATIO, 72),
  );
  const hasEnoughDistance = Math.abs(translationY) >= threshold;
  const hasEnoughVelocity = Math.abs(velocityY) >= MIN_TRANSITION_VELOCITY;

  if (!hasEnoughDistance && !hasEnoughVelocity) {
    return 0;
  }

  return translationY < 0 ? 1 : -1;
}
