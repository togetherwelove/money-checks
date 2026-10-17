const NICE_STEP_MULTIPLIERS = [1, 2, 5, 10] as const;
const DECIMAL_BASE = 10;

export function buildChartAxis(maxAmount: number, labelCount: number) {
  if (!Number.isFinite(maxAmount) || maxAmount <= 0) {
    return { maximum: 0, ticks: [{ amount: 0, key: "zero" }] };
  }
  const intervalCount = Math.max(1, labelCount - 1);
  const rawStep = maxAmount / intervalCount;
  const magnitude = DECIMAL_BASE ** Math.floor(Math.log10(rawStep));
  const multiplier = NICE_STEP_MULTIPLIERS.find((value) => value * magnitude >= rawStep)
    ?? DECIMAL_BASE;
  const step = Math.max(1, multiplier * magnitude);
  const maximum = Math.ceil(maxAmount / step) * step;
  const ticks = Array.from({ length: Math.round(maximum / step) + 1 }, (_, index) => ({
    amount: maximum - index * step,
    key: `tick-${index}`,
  }));
  return { maximum, ticks };
}
