import { useEffect, useState } from "react";
import { isComplete, markVisited, setComplete } from "../lib/progress";
import { Check } from "./icons";

export default function LessonComplete({ slug, nextHref, nextTitle }: { slug: string; nextHref?: string; nextTitle?: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(isComplete(slug));
    markVisited(slug);
  }, [slug]);

  const toggle = () => {
    const next = !done;
    setComplete(slug, next);
    setDone(next);
  };

  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 rounded-xl2 border p-4" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
      <button
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-transform active:scale-95"
        style={
          done
            ? { background: "color-mix(in oklab, #22c55e 16%, transparent)", color: "#16a34a", border: "1px solid color-mix(in oklab, #22c55e 45%, transparent)" }
            : { background: "var(--accent)", color: "var(--accent-contrast)", border: "1px solid transparent" }
        }
      >
        <Check /> {done ? "Completed" : "Mark as complete"}
      </button>

      {nextHref && (
        <a
          href={nextHref}
          className="ml-auto text-sm font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Next: {nextTitle} →
        </a>
      )}
    </div>
  );
}
