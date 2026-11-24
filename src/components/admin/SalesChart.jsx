import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice } from '../../utils/product';
import { formatDayKey, formatNumber } from '../../utils/format';
import { SITE, CURRENCY_SYMBOL } from '../../config/site';

// Column chart of revenue per day (one series, so no legend: the card title names it).
// Hover or arrow keys show a day's revenue and orders; "Table" lists every value.
const HEIGHT = 240;
const MARGIN = { top: 16, right: 8, bottom: 28, left: 56 };
const BAR_MAX = 24; // columns never fill their slot
const GAP = 2; // surface gap between neighbouring columns
const RADIUS = 4; // rounded data end, square at the baseline

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: SITE.currency, notation: 'compact', maximumFractionDigits: 1,
});
const tickLabel = (v) => (v < 10000 ? `${CURRENCY_SYMBOL}${formatNumber(v)}` : compactCurrency.format(v));

// 0, step, 2·step, … with a "nice" step (1, 2, 2.5, 5 × 10ⁿ) that covers max
function niceTicks(max, count = 4) {
  if (max <= 0) return [0];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 1000; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

// Column with a rounded top and a square bottom
function columnPath(x, y, w, h) {
  const r = Math.min(RADIUS, w / 2, h);
  const bottom = y + h;
  return `M${x},${bottom}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${bottom}Z`;
}

export default function SalesChart({ data = [], refreshing = false }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [showTable]);

  const max = useMemo(() => Math.max(0, ...data.map((d) => d.revenue)), [data]);
  const ticks = useMemo(() => niceTicks(max), [max]);
  const top = ticks[ticks.length - 1] || 1;
  const hasSales = max > 0;

  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const n = data.length || 1;
  const slot = innerW / n;
  const barW = Math.max(1, Math.min(BAR_MAX, slot - GAP));
  const yOf = (v) => innerH - (v / top) * innerH;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 64))));

  const activeDay = active != null ? data[active] : null;

  function onKeyDown(e) {
    if (!data.length) return;
    const last = data.length - 1;
    const moves = { ArrowLeft: -1, ArrowRight: 1 };
    if (e.key in moves) {
      e.preventDefault();
      setActive((i) => Math.min(last, Math.max(0, (i ?? last) + moves[e.key])));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(last);
    }
  }

  return (
    <div className={`transition-opacity ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
      <div className="mb-2 flex justify-end">
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-bold" role="group" aria-label="Chart or table">
          <button type="button" onClick={() => setShowTable(false)} aria-pressed={!showTable}
            className={`rounded-md px-2.5 py-1 ${!showTable ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            Chart
          </button>
          <button type="button" onClick={() => setShowTable(true)} aria-pressed={showTable}
            className={`rounded-md px-2.5 py-1 ${showTable ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            Table
          </button>
        </div>
      </div>

      {showTable ? (
        <div className="max-h-72 overflow-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <caption className="sr-only">Revenue and orders per day</caption>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-bold">Day</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">Orders</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {[...data].reverse().map((day) => (
                <tr key={day.date}>
                  <th scope="row" className="px-3 py-2 text-left font-semibold text-slate-700">{formatDayKey(day.date)}</th>
                  <td className="px-3 py-2 text-right text-slate-600">{formatNumber(day.orders)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatPrice(day.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          ref={wrapRef}
          className="relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          style={{ height: HEIGHT }}
          tabIndex={0}
          role="group"
          aria-label="Revenue per day. Use the left and right arrow keys to read each day."
          onKeyDown={onKeyDown}
          onFocus={() => setActive((i) => i ?? data.length - 1)}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
        >
          {width > 0 && (
            <svg width={width} height={HEIGHT} aria-hidden="true" className="block">
              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                {/* Gridlines + y-axis labels (hairline, solid, recessive) */}
                {ticks.map((t) => (
                  <g key={t} transform={`translate(0,${yOf(t)})`}>
                    <line x1={0} x2={innerW} stroke="rgb(226 232 240)" strokeWidth={1} shapeRendering="crispEdges" />
                    <text x={-10} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[11px] tabular-nums">{tickLabel(t)}</text>
                  </g>
                ))}

                {/* Columns */}
                {data.map((day, i) => {
                  if (day.revenue <= 0) return null;
                  const h = Math.max(1, innerH - yOf(day.revenue));
                  const x = i * slot + (slot - barW) / 2;
                  return (
                    <path
                      key={day.date}
                      d={columnPath(x, innerH - h, barW, h)}
                      className={`transition-colors ${active === i ? 'fill-primary-600' : 'fill-primary-400'}`}
                    />
                  );
                })}

                {/* Hit areas: the whole day slot, bigger than the column */}
                {data.map((day, i) => (
                  <rect
                    key={day.date}
                    x={i * slot}
                    y={0}
                    width={slot}
                    height={innerH}
                    fill="transparent"
                    onPointerEnter={() => setActive(i)}
                    onPointerMove={() => setActive(i)}
                  />
                ))}

                {/* X-axis day labels */}
                {data.map((day, i) => (i % labelEvery === 0 || i === data.length - 1) && (i === data.length - 1 || data.length - 1 - i >= labelEvery) ? (
                  <text
                    key={day.date}
                    x={i === data.length - 1 && i > 0 ? innerW : i * slot + slot / 2}
                    y={innerH + 18}
                    textAnchor={i === data.length - 1 && i > 0 ? "end" : "middle"}
                    className="fill-slate-400 text-[11px]"
                  >
                    {formatDayKey(day.date)}
                  </text>
                ) : null)}
              </g>
            </svg>
          )}

          {!hasSales && (
            <div className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-sm font-semibold text-slate-400">
              No sales in this period yet
            </div>
          )}

          {/* Tooltip: value first, then the label */}
          {activeDay && width > 0 && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-secondary px-3 py-2 text-xs text-white shadow-xl"
              style={{
                left: Math.min(width - 70, Math.max(70, MARGIN.left + active * slot + slot / 2)),
                top: MARGIN.top + yOf(activeDay.revenue) - 8,
              }}
            >
              <p className="text-sm font-extrabold">{formatPrice(activeDay.revenue)}</p>
              <p className="mt-0.5 whitespace-nowrap text-slate-300">
                {formatNumber(activeDay.orders)} order{activeDay.orders === 1 ? '' : 's'} · {formatDayKey(activeDay.date)}
              </p>
            </div>
          )}

          <p className="sr-only" aria-live="polite">
            {activeDay ? `${formatDayKey(activeDay.date)}: ${formatPrice(activeDay.revenue)}, ${activeDay.orders} orders` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
