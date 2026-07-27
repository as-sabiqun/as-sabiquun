import type { CSSProperties } from "react";
import type { DashboardMetricPoint } from "@/lib/dashboard-analytics";
import styles from "./dashboard-charts.module.css";

export interface DashboardChartSeries {
  key: string;
  label: string;
  color: string;
}

interface ChartProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  points: DashboardMetricPoint[];
  series: DashboardChartSeries[];
  format?: "number" | "currency";
}

export function DashboardLineChart({ id, eyebrow, title, description, points, series, format = "number" }: ChartProps) {
  const width = 760;
  const height = 250;
  const padding = { top: 26, right: 20, bottom: 38, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const allValues = points.flatMap((point) => series.map((item) => point.values[item.key] ?? 0));
  const maximum = Math.max(1, ...allValues);
  const x = (index: number) => padding.left + (index / Math.max(1, points.length - 1)) * chartWidth;
  const y = (value: number) => padding.top + chartHeight - (value / maximum) * chartHeight;
  const paths = series.map((item) => points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.values[item.key] ?? 0)}`).join(" "));
  const primaryArea = paths[0] ? `${paths[0]} L${x(points.length - 1)},${padding.top + chartHeight} L${x(0)},${padding.top + chartHeight} Z` : "";
  const empty = allValues.every((value) => value === 0);

  return (
    <figure className={styles.chartShell}>
      <ChartHeader eyebrow={eyebrow} title={title} description={description} series={series} />
      <div className={styles.plotWrap}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-title ${id}-description`} className={styles.plot}>
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-description`}>{description}</desc>
          {[0, 0.5, 1].map((ratio) => {
            const lineY = padding.top + chartHeight * ratio;
            const value = maximum * (1 - ratio);
            return <g key={ratio}><line x1={padding.left} y1={lineY} x2={width - padding.right} y2={lineY} className={styles.gridLine} /><text x={padding.left - 9} y={lineY + 4} textAnchor="end" className={styles.axisValue}>{compactValue(value, format)}</text></g>;
          })}
          {primaryArea && <path d={primaryArea} fill={series[0].color} className={styles.area} />}
          {paths.map((path, seriesIndex) => <path key={series[seriesIndex].key} d={path} fill="none" stroke={series[seriesIndex].color} className={styles.line} />)}
          {series.map((item, seriesIndex) => points.map((point, index) => {
            const value = point.values[item.key] ?? 0;
            return <circle key={`${item.key}-${point.label}`} cx={x(index)} cy={y(value)} r={seriesIndex === 0 ? 4 : 3} fill={item.color} className={styles.point}><title>{point.label}: {formatValue(value, format)}</title></circle>;
          }))}
          {points.map((point, index) => <text key={point.label} x={x(index)} y={height - 13} textAnchor="middle" className={styles.axisLabel}>{point.label}</text>)}
          {empty && <text x={width / 2} y={height / 2} textAnchor="middle" className={styles.emptyLabel}>Activity will appear as records are completed.</text>}
        </svg>
      </div>
      <AccessibleTable title={title} points={points} series={series} format={format} />
    </figure>
  );
}

export function DashboardBarChart({ id, eyebrow, title, description, points, series, format = "number" }: ChartProps) {
  const width = 760;
  const height = 255;
  const padding = { top: 25, right: 20, bottom: 40, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const allValues = points.flatMap((point) => series.map((item) => point.values[item.key] ?? 0));
  const maximum = Math.max(1, ...allValues, 0);
  const minimum = Math.min(0, ...allValues);
  const span = Math.max(1, maximum - minimum);
  const y = (value: number) => padding.top + ((maximum - value) / span) * chartHeight;
  const zeroY = y(0);
  const groupWidth = chartWidth / Math.max(1, points.length);
  const barWidth = Math.max(7, Math.min(23, (groupWidth - 18) / Math.max(1, series.length)));
  const empty = allValues.every((value) => value === 0);

  return (
    <figure className={styles.chartShell}>
      <ChartHeader eyebrow={eyebrow} title={title} description={description} series={series} />
      <div className={styles.plotWrap}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-title ${id}-description`} className={styles.plot}>
          <title id={`${id}-title`}>{title}</title>
          <desc id={`${id}-description`}>{description}</desc>
          {[maximum, 0, minimum].filter((value, index, values) => values.indexOf(value) === index).map((value) => <g key={value}><line x1={padding.left} y1={y(value)} x2={width - padding.right} y2={y(value)} className={value === 0 ? styles.zeroLine : styles.gridLine} /><text x={padding.left - 9} y={y(value) + 4} textAnchor="end" className={styles.axisValue}>{compactValue(value, format)}</text></g>)}
          {points.map((point, pointIndex) => {
            const groupX = padding.left + pointIndex * groupWidth + (groupWidth - barWidth * series.length) / 2;
            return <g key={point.label}>{series.map((item, seriesIndex) => {
              const value = point.values[item.key] ?? 0;
              const valueY = y(value);
              return <rect key={item.key} x={groupX + seriesIndex * barWidth} y={Math.min(zeroY, valueY)} width={barWidth - 3} height={Math.max(0, Math.abs(valueY - zeroY))} rx="4" fill={item.color} className={styles.bar}><title>{item.label}, {point.label}: {formatValue(value, format)}</title></rect>;
            })}<text x={padding.left + pointIndex * groupWidth + groupWidth / 2} y={height - 13} textAnchor="middle" className={styles.axisLabel}>{point.label}</text></g>;
          })}
          {empty && <text x={width / 2} y={height / 2} textAnchor="middle" className={styles.emptyLabel}>Transactions will appear after the first recorded movement.</text>}
        </svg>
      </div>
      <AccessibleTable title={title} points={points} series={series} format={format} />
    </figure>
  );
}

export function DashboardDonut({ id, eyebrow, title, description, segments, centerLabel = "total" }: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  segments: Array<{ label: string; value: number; color: string }>;
  centerLabel?: string;
}) {
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 41;
  const circumference = 2 * Math.PI * radius;
  const arcs = visible.map((segment, index) => {
    const length = total ? (segment.value / total) * circumference : 0;
    const previousLength = visible.slice(0, index).reduce((sum, item) => sum + (item.value / total) * circumference, 0);
    return { ...segment, length, dashOffset: -previousLength };
  });

  return (
    <figure className={`${styles.chartShell} ${styles.donutShell}`}>
      <ChartHeader eyebrow={eyebrow} title={title} description={description} series={[]} />
      <div className={styles.donutBody}>
        <div className={styles.donutPlot}>
          <svg viewBox="0 0 100 100" role="img" aria-labelledby={`${id}-title ${id}-description`}>
            <title id={`${id}-title`}>{title}</title>
            <desc id={`${id}-description`}>{description}</desc>
            <circle cx="50" cy="50" r={radius} className={styles.donutTrack} />
            {arcs.map((segment) => <circle key={segment.label} cx="50" cy="50" r={radius} fill="none" stroke={segment.color} strokeDasharray={`${segment.length} ${circumference - segment.length}`} strokeDashoffset={segment.dashOffset} className={styles.donutSegment} transform="rotate(-90 50 50)"><title>{segment.label}: {segment.value}</title></circle>)}
          </svg>
          <div><strong>{total}</strong><span>{centerLabel}</span></div>
        </div>
        <dl className={styles.donutLegend}>
          {segments.map((segment) => <div key={segment.label}><dt><i style={{ "--legend-color": segment.color } as CSSProperties} />{segment.label}</dt><dd>{segment.value}</dd></div>)}
        </dl>
      </div>
    </figure>
  );
}

export function DashboardDistribution({ label, totalLabel, segments }: {
  label: string;
  totalLabel: string;
  segments: Array<{ label: string; value: number; color: string; valueLabel?: string }>;
}) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  return (
    <div className={styles.distribution}>
      <div className={styles.distributionHead}><strong>{label}</strong><span>{totalLabel}</span></div>
      <div className={styles.distributionTrack} role="img" aria-label={`${label}: ${segments.map((segment) => `${segment.label} ${segment.valueLabel ?? segment.value}`).join(", ")}`}>
        {segments.filter((segment) => segment.value > 0).map((segment) => <i key={segment.label} style={{ width: `${(segment.value / Math.max(1, total)) * 100}%`, "--segment-color": segment.color } as CSSProperties} />)}
      </div>
      <div className={styles.distributionLegend}>{segments.map((segment) => <span key={segment.label}><i style={{ "--legend-color": segment.color } as CSSProperties} /><b>{segment.label}</b> {segment.valueLabel ?? segment.value}</span>)}</div>
    </div>
  );
}

function ChartHeader({ eyebrow, title, description, series }: Pick<ChartProps, "eyebrow" | "title" | "description" | "series">) {
  return <figcaption className={styles.chartHeader}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{series.length > 0 && <div className={styles.legend}>{series.map((item) => <span key={item.key}><i style={{ "--legend-color": item.color } as CSSProperties} />{item.label}</span>)}</div>}</figcaption>;
}

function AccessibleTable({ title, points, series, format }: Pick<ChartProps, "title" | "points" | "series" | "format">) {
  return <table className={styles.srTable}><caption>{title} data</caption><thead><tr><th scope="col">Period</th>{series.map((item) => <th scope="col" key={item.key}>{item.label}</th>)}</tr></thead><tbody>{points.map((point) => <tr key={point.label}><th scope="row">{point.label}</th>{series.map((item) => <td key={item.key}>{formatValue(point.values[item.key] ?? 0, format ?? "number")}</td>)}</tr>)}</tbody></table>;
}

function formatValue(value: number, format: "number" | "currency") {
  return format === "currency" ? `S$${(value / 100).toLocaleString("en-SG", { maximumFractionDigits: 0 })}` : value.toLocaleString("en-SG");
}

function compactValue(value: number, format: "number" | "currency") {
  const compact = new Intl.NumberFormat("en-SG", { notation: "compact", maximumFractionDigits: 1 }).format(value / (format === "currency" ? 100 : 1));
  return format === "currency" ? `S$${compact}` : compact;
}
