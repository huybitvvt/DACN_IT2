import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { RetentionTrendPoint } from '@/lib/retentionApi';

const width = 720;
const height = 260;
const padding = { top: 18, right: 22, bottom: 40, left: 44 };
const plotWidth = width - padding.left - padding.right;
const plotHeight = height - padding.top - padding.bottom;

function xAt(index: number, count: number) {
  return padding.left + (index / Math.max(1, count - 1)) * plotWidth;
}

function yAt(score: number) {
  return padding.top + ((100 - score) / 100) * plotHeight;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(
    new Date(`${value}T00:00:00`),
  );
}

export default function RetentionTrendChart({
  points,
  delta7d,
  direction,
  averageScore,
  bestScore,
}: {
  points: RetentionTrendPoint[];
  delta7d: number;
  direction: 'UP' | 'DOWN' | 'STABLE';
  averageScore: number;
  bestScore: number;
}) {
  if (points.length === 0) return null;

  const line = points
    .map((point, index) => `${xAt(index, points.length)},${yAt(point.score)}`)
    .join(' ');
  const area = `${padding.left},${padding.top + plotHeight} ${line} ${padding.left + plotWidth},${padding.top + plotHeight}`;
  const midpoint = Math.floor((points.length - 1) / 2);
  const TrendIcon =
    direction === 'UP' ? ArrowUpRight : direction === 'DOWN' ? ArrowDownRight : ArrowRight;
  const trendTone =
    direction === 'UP'
      ? 'text-emerald-700 dark:text-emerald-300'
      : direction === 'DOWN'
        ? 'text-rose-700 dark:text-rose-300'
        : 'text-amber-700 dark:text-amber-300';

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-ink-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Xu hướng giữ nhịp 28 ngày
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Điểm được tái dựng từ hoạt động học thật theo cùng công thức V3.
          </p>
        </div>
        <div className={`flex items-center gap-2 text-sm font-bold ${trendTone}`}>
          <TrendIcon className="h-5 w-5" />
          {delta7d > 0 ? '+' : ''}
          {delta7d} điểm so với 7 ngày trước
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-slate-950">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Biểu đồ điểm giữ nhịp trong 28 ngày"
        >
          <rect
            x={padding.left}
            y={yAt(100)}
            width={plotWidth}
            height={yAt(70) - yAt(100)}
            fill="#10b981"
            opacity="0.08"
          />
          <rect
            x={padding.left}
            y={yAt(70)}
            width={plotWidth}
            height={yAt(45) - yAt(70)}
            fill="#f59e0b"
            opacity="0.09"
          />
          <rect
            x={padding.left}
            y={yAt(45)}
            width={plotWidth}
            height={yAt(0) - yAt(45)}
            fill="#f43f5e"
            opacity="0.07"
          />

          {[0, 25, 45, 70, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={yAt(tick)}
                x2={padding.left + plotWidth}
                y2={yAt(tick)}
                stroke="currentColor"
                className="text-gray-300 dark:text-gray-700"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={yAt(tick) + 4}
                textAnchor="end"
                className="fill-gray-500 text-[11px] dark:fill-gray-400"
              >
                {tick}
              </text>
            </g>
          ))}

          <polygon points={area} fill="#059669" opacity="0.08" />
          <polyline
            points={line}
            fill="none"
            stroke="#059669"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
            <circle
              key={point.date}
              cx={xAt(index, points.length)}
              cy={yAt(point.score)}
              r={index === points.length - 1 ? 5 : 2.5}
              fill={point.score >= 70 ? '#059669' : point.score >= 45 ? '#d97706' : '#e11d48'}
              stroke="white"
              strokeWidth={index === points.length - 1 ? 2 : 1}
            >
              <title>
                {formatShortDate(point.date)}: {point.score} điểm, {point.activeDays14} ngày học/14
                ngày
              </title>
            </circle>
          ))}

          {[0, midpoint, points.length - 1].map((index) => (
            <text
              key={points[index].date}
              x={xAt(index, points.length)}
              y={height - 14}
              textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
              className="fill-gray-500 text-[11px] dark:fill-gray-400"
            >
              {formatShortDate(points[index].date)}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <TrendMetric label="Trung bình 28 ngày" value={`${averageScore}/100`} />
        <TrendMetric label="Điểm tốt nhất" value={`${bestScore}/100`} />
        <TrendMetric label="Ngưỡng ổn định" value="Từ 70" />
      </div>
    </section>
  );
}

function TrendMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-2 py-3 dark:bg-slate-900">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-black text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
