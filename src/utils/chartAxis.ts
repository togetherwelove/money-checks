const DECIMAL_BASE = 10;

export function buildChartAxis(maxAmount: number, labelCount: number) {
  if (!Number.isFinite(maxAmount) || maxAmount <= 0) {
    return { maximum: 0, ticks: [{ amount: 0, key: "zero" }] };
  }
  const intervalCount = Math.max(1, labelCount - 1);
  // Round the upper bound first so a large step cannot inflate the visible range.
  const magnitude = DECIMAL_BASE ** Math.floor(Math.log10(maxAmount));
  const roundedMaximum = Math.ceil(maxAmount / magnitude) * magnitude;
  const step = Math.max(1, Math.ceil(roundedMaximum / intervalCount));
  const maximum = Math.ceil(roundedMaximum / step) * step;
  const ticks = Array.from({ length: Math.round(maximum / step) + 1 }, (_, index) => ({
    amount: maximum - index * step,
    key: `tick-${index}`,
  }));
  return { maximum, ticks };
}
