import styles from "./dashboard.module.css";

export interface ImpactPoint {
  label: string;
  started: number;
  verified: number;
}

function curvedPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const middle = (previous.x + point.x) / 2;
    return `${path} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

export function ImpactChart({ points }: { points: ImpactPoint[] }) {
  const width = 760;
  const height = 264;
  const padding = { top: 28, right: 24, bottom: 42, left: 34 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;
  const maximum = Math.max(1, ...points.flatMap((point) => [point.started, point.verified]));
  const coordinates = (key: "started" | "verified") => points.map((point, index) => ({
    x: padding.left + (index / Math.max(1, points.length - 1)) * chartWidth,
    y: padding.top + chartHeight - (point[key] / maximum) * chartHeight,
  }));
  const started = coordinates("started");
  const verified = coordinates("verified");
  const startedPath = curvedPath(started);
  const verifiedPath = curvedPath(verified);
  const baseY = padding.top + chartHeight;
  const areaPath = startedPath ? `${startedPath} L ${started.at(-1)?.x} ${baseY} L ${started[0].x} ${baseY} Z` : "";
  const hasActivity = points.some((point) => point.started > 0 || point.verified > 0);

  return (
    <div className={styles.chartWrap}>
      <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="impact-chart-title impact-chart-desc">
        <title id="impact-chart-title">Your giving journey over the last eight months</title>
        <desc id="impact-chart-desc">Cumulative services started and projects approved through As-Sābiqūn.</desc>
        <defs>
          <linearGradient id="journey-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7f4ec" stopOpacity="0.28" />
            <stop offset="1" stopColor="#f7f4ec" stopOpacity="0.02" />
          </linearGradient>
          <pattern id="islamic-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M22 4 40 22 22 40 4 22Z" fill="none" stroke="#f7f4ec" strokeOpacity=".05" />
            <circle cx="22" cy="22" r="8" fill="none" stroke="#f7f4ec" strokeOpacity=".035" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#islamic-grid)" />
        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          return <line key={ratio} x1={padding.left} y1={y} x2={width - padding.right} y2={y} className={styles.chartGrid} />;
        })}
        {areaPath && <path d={areaPath} fill="url(#journey-area)" />}
        {startedPath && <path d={startedPath} className={styles.chartStartedLine} />}
        {verifiedPath && <path d={verifiedPath} className={styles.chartVerifiedLine} />}
        {verified.map((point, index) => (
          <g key={`verified-${points[index].label}`}>
            <circle cx={point.x} cy={point.y} r="7" className={styles.chartPointHalo} />
            <circle cx={point.x} cy={point.y} r="3.5" className={styles.chartPoint} />
          </g>
        ))}
        {points.map((point, index) => (
          <text key={point.label} x={started[index].x} y={height - 14} textAnchor="middle" className={styles.chartLabel}>{point.label}</text>
        ))}
        {!hasActivity && (
          <text x={width / 2} y={height / 2} textAnchor="middle" className={styles.chartEmpty}>Your first contribution will begin this journey.</text>
        )}
      </svg>
    </div>
  );
}
