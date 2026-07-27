export interface DashboardMetricEvent {
  metric: string;
  occurredAt: string | null | undefined;
  value?: number;
}

export interface DashboardMetricPoint {
  label: string;
  values: Record<string, number>;
}

export function buildMonthlyMetricSeries(
  metricKeys: readonly string[],
  events: readonly DashboardMetricEvent[],
  now = new Date(),
  monthCount = 6,
): DashboardMetricPoint[] {
  if (monthCount < 1) return [];

  const endMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startMonth = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() - (monthCount - 1), 1));
  const points = Array.from({ length: monthCount }, (_, index) => {
    const month = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + index, 1));
    return {
      label: new Intl.DateTimeFormat("en-SG", { month: "short", timeZone: "UTC" }).format(month),
      values: Object.fromEntries(metricKeys.map((key) => [key, 0])),
    };
  });

  for (const event of events) {
    if (!event.occurredAt || !metricKeys.includes(event.metric)) continue;
    const occurredAt = new Date(event.occurredAt);
    if (Number.isNaN(occurredAt.getTime()) || occurredAt < startMonth) continue;
    const monthIndex = (occurredAt.getUTCFullYear() - startMonth.getUTCFullYear()) * 12
      + occurredAt.getUTCMonth() - startMonth.getUTCMonth();
    if (monthIndex < 0 || monthIndex >= points.length) continue;
    points[monthIndex].values[event.metric] += event.value ?? 1;
  }

  return points;
}
