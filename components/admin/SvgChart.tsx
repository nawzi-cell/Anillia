"use client";

import { useId } from "react";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

export interface ChartPoint {
  label: string;
  value: number;
}

function niceCeil(n: number): number {
  if (n <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const m = n / pow;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * pow;
}

/* ------------------------------------------------------------------ */
/* LineChart                                                           */
/* ------------------------------------------------------------------ */

interface LineChartProps {
  data: ChartPoint[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}

export function LineChart({
  data,
  height = 220,
  color = "#737963",
  valueFormatter = (v) => v.toLocaleString("en-PK"),
}: LineChartProps) {
  const gid = useId();
  const W = 720;
  const H = height;
  const padL = 48;
  const padR = 12;
  const padT = 14;
  const padB = 30;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-espresso-muted"
        style={{ height }}
      >
        No data yet.
      </div>
    );
  }

  const max = niceCeil(Math.max(...data.map((d) => d.value), 0) * 1.1);
  const stepX = data.length > 1 ? iw / (data.length - 1) : 0;
  const x = (i: number) => padL + i * stepX;
  const y = (v: number) => padT + ih - (v / max) * ih;

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${(padT + ih).toFixed(1)} L${padL},${(
    padT + ih
  ).toFixed(1)} Z`;

  const ticks = [0, 0.5, 1].map((t) => t * max);
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Revenue over time"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(t)}
            y2={y(t)}
            stroke="#2A2521"
            strokeOpacity="0.08"
          />
          <text
            x={padL - 8}
            y={y(t) + 4}
            textAnchor="end"
            fontSize="11"
            fill="#5C534C"
          >
            {valueFormatter(t)}
          </text>
        </g>
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <g key={i}>
          {i % labelEvery === 0 && (
            <text
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#5C534C"
            >
              {d.label}
            </text>
          )}
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill={color}>
            <title>{`${d.label}: ${valueFormatter(d.value)}`}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* BarChart                                                            */
/* ------------------------------------------------------------------ */

interface BarChartProps {
  data: ChartPoint[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}

export function BarChart({
  data,
  height = 220,
  color = "#A69A89",
  valueFormatter = (v) => v.toLocaleString("en-PK"),
}: BarChartProps) {
  const W = 720;
  const H = height;
  const padL = 48;
  const padR = 12;
  const padT = 14;
  const padB = 34;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-espresso-muted"
        style={{ height }}
      >
        No data yet.
      </div>
    );
  }

  const max = niceCeil(Math.max(...data.map((d) => d.value), 0) * 1.15);
  const slot = iw / data.length;
  const barW = Math.min(48, slot * 0.55);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Bar chart"
    >
      {[0, 0.5, 1].map((t) => {
        const tv = t * max;
        const yy = padT + ih - (tv / max) * ih;
        return (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yy}
              y2={yy}
              stroke="#2A2521"
              strokeOpacity="0.08"
            />
            <text
              x={padL - 8}
              y={yy + 4}
              textAnchor="end"
              fontSize="11"
              fill="#5C534C"
            >
              {valueFormatter(tv)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bw = Math.min(barW, Math.max(6, slot - 8));
        const bx = padL + i * slot + (slot - bw) / 2;
        const bh = (d.value / max) * ih;
        const by = padT + ih - bh;
        return (
          <g key={i}>
            <rect x={bx} y={by} width={bw} height={bh} rx="4" fill={color}>
              <title>{`${d.label}: ${valueFormatter(d.value)}`}</title>
            </rect>
            <text
              x={bx + bw / 2}
              y={H - 10}
              textAnchor="middle"
              fontSize="11"
              fill="#5C534C"
            >
              {d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* DonutChart                                                          */
/* ------------------------------------------------------------------ */

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function DonutChart({
  segments,
  size = 200,
  thickness = 32,
}: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = size / 2;
  const outer = r - 4;
  const inner = outer - thickness;
  const mid = (outer + inner) / 2;

  if (total <= 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-espresso-muted"
        style={{ width: size, height: size }}
      >
        No data yet.
      </div>
    );
  }

  let acc = 0;
  const arcs = segments.map((seg) => {
    const start = (acc / total) * 360;
    acc += seg.value;
    const end = (acc / total) * 360;
    return { ...seg, start, end };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Orders by status"
      >
        {arcs.map((a, i) => {
          const sweep = a.end - a.start;
          const p1 = polar(r, r, mid, a.start);
          const p2 = polar(r, r, mid, a.end);
          const large = sweep > 180 ? 1 : 0;
          // Full circle edge case
          const d =
            sweep >= 359.99
              ? `M ${r - mid} ${r} A ${mid} ${mid} 0 1 0 ${r + mid} ${r} A ${mid} ${mid} 0 1 0 ${r - mid} ${r}`
              : `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${mid} ${mid} 0 ${large} 1 ${p2.x.toFixed(
                  2,
                )} ${p2.y.toFixed(2)}`;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={a.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
            >
              <title>{`${a.label}: ${a.value}`}</title>
            </path>
          );
        })}
        <text
          x={r}
          y={r - 6}
          textAnchor="middle"
          fontSize="26"
          fontWeight="600"
          fill="#2A2521"
          fontFamily="var(--font-cormorant), Georgia, serif"
        >
          {total}
        </text>
        <text
          x={r}
          y={r + 16}
          textAnchor="middle"
          fontSize="11"
          fill="#5C534C"
        >
          orders
        </text>
      </svg>
      <ul className="flex flex-col gap-1.5">
        {arcs.map((a, i) => (
          <li
            key={i}
            className="flex items-center gap-2 font-sans text-sm text-espresso"
          >
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: a.color }}
            />
            <span className="font-medium">{a.label}</span>
            <span className="text-espresso-muted">· {a.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
