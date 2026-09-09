import { useEffect, useState } from "react";
import { getProgress, onChange } from "../lib/progress";

/** Live "x of y lessons done" indicator, driven by localStorage. */
export default function ProgressRing({ total, slugs, compact = false }: { total: number; slugs: string[]; compact?: boolean }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const recount = () => {
      const completed = new Set(getProgress().completed);
      setDone(slugs.filter((slug) => completed.has(slug)).length);
    };
    recount();
    return onChange(recount);
  }, [slugs]);

  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const size = compact ? 34 : 46;
  const stroke = compact ? 3.5 : 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <span className="inline-flex items-center gap-2.5" title={`${done} of ${total} lessons complete`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 600ms var(--ease-out-quint)" }}
        />
      </svg>
      {!compact && (
        <span className="text-sm leading-tight">
          <strong style={{ color: "var(--text)" }}>{done}</strong>
          <span style={{ color: "var(--text-faint)" }}> / {total} lessons</span>
        </span>
      )}
      {compact && (
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
          {pct}%
        </span>
      )}
    </span>
  );
}
