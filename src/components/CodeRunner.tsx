import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";
import { createEditor } from "./editor";
import { preload, run, stop, subscribe, type RunResult, type RuntimePhase } from "../lib/python-runtime";
import { Play, Stop, Reset, Copy, Check, Cross, Terminal, ChevronDown, Lightbulb } from "./icons";

interface Line {
  stream: "stdout" | "stderr" | "meta";
  text: string;
}

export interface CodeRunnerProps {
  /** Stable id; the learner's edits are remembered under it. */
  id: string;
  code: string;
  /** Python that raises AssertionError when the learner's answer is wrong. */
  tests?: string;
  solution?: string;
  hint?: string;
  /** Exercise mode adds pass/fail checking, hint and solution. */
  exercise?: boolean;
  /** Preloaded stdin lines for lessons that call input(). */
  stdin?: string;
  editable?: boolean;
  label?: string;
  minHeight?: number;
}

const PHASE_TEXT: Record<RuntimePhase, string> = {
  idle: "Python not started",
  downloading: "Downloading Python",
  starting: "Starting Python",
  installing: "Installing packages",
  ready: "Python ready",
  error: "Runtime error",
};

export default function CodeRunner({
  id,
  code,
  tests,
  solution,
  hint,
  exercise = false,
  stdin: initialStdin = "",
  editable = true,
  label,
  minHeight = 0,
}: CodeRunnerProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const source = useRef(code);

  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [phase, setPhase] = useState<RuntimePhase>("idle");
  const [phaseDetail, setPhaseDetail] = useState("");
  const [copied, setCopied] = useState(false);
  const [showStdin, setShowStdin] = useState(Boolean(initialStdin));
  const [stdin, setStdin] = useState(initialStdin);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const storageKey = `lpai:code:${id}`;

  // --- editor lifecycle -----------------------------------------------------
  useEffect(() => {
    if (!host.current || view.current) return;

    let initial = code;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) initial = saved;
    } catch {
      // No stored draft available; fall back to the lesson's starter code.
    }
    source.current = initial;

    view.current = createEditor(host.current, {
      doc: initial,
      readOnly: !editable,
      onChange: (value) => {
        source.current = value;
        try {
          if (value === code) localStorage.removeItem(storageKey);
          else localStorage.setItem(storageKey, value);
        } catch {
          // Draft persistence is a convenience, not a requirement.
        }
      },
      onRun: () => runRef.current(),
    });

    return () => {
      view.current?.destroy();
      view.current = null;
    };
    // The editor is created once; `code` changes would come from a new island.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => subscribe((p, d) => {
    setPhase(p);
    setPhaseDetail(d);
  }), []);

  // Warm the runtime as soon as an editor scrolls into view, so the first
  // Run does not sit through a 10 MB download.
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          preload();
          observer.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // --- running --------------------------------------------------------------
  const doRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setLines([]);

    const buffer: Line[] = [];
    let frame = 0;
    const flush = () => {
      frame = 0;
      setLines([...buffer]);
    };

    const outcome = await run(
      { code: source.current, stdin: stdin || undefined, tests: exercise ? tests : undefined },
      {
        onOutput: (stream, text) => {
          buffer.push({ stream, text });
          // Batch repaints: a tight print loop can emit thousands of lines.
          if (!frame) frame = requestAnimationFrame(flush);
        },
      }
    );

    if (frame) cancelAnimationFrame(frame);
    setLines([...buffer]);
    setResult(outcome);
    setRunning(false);
  }, [running, stdin, exercise, tests]);

  const runRef = useRef(doRun);
  runRef.current = doRun;

  const handleStop = () => {
    stop();
    setRunning(false);
    setLines((prev) => [...prev, { stream: "meta", text: "— stopped —" }]);
  };

  const replaceDoc = (next: string) => {
    const v = view.current;
    if (!v) return;
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: next } });
    source.current = next;
  };

  const handleReset = () => {
    replaceDoc(code);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nothing stored to clear.
    }
    setLines([]);
    setResult(null);
    setShowSolution(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(source.current);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard permission denied — the code is selectable in the editor.
    }
  };

  const status = useMemo(() => {
    if (running) return { tone: "busy" as const, text: phase === "ready" ? "Running" : PHASE_TEXT[phase] };
    if (phase === "error") return { tone: "bad" as const, text: phaseDetail || PHASE_TEXT.error };
    if (phase === "ready") return { tone: "ok" as const, text: phaseDetail || PHASE_TEXT.ready };
    if (phase === "idle") return { tone: "idle" as const, text: PHASE_TEXT.idle };
    return { tone: "busy" as const, text: phaseDetail || PHASE_TEXT[phase] };
  }, [running, phase, phaseDetail]);

  const passed = result?.tests?.ok === true;
  const failed = result?.tests?.ok === false;

  return (
    <div
      className="my-6 overflow-hidden rounded-xl2 border shadow-sm"
      style={{ background: "var(--bg-elevated)", borderColor: passed ? "color-mix(in oklab, #22c55e 45%, var(--border))" : "var(--border)" }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-2 border-b px-3 py-2"
        style={{ background: "var(--bg-sunken)" }}
      >
        <span className="mr-auto flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          <Terminal className="opacity-70" />
          {label ?? (exercise ? "Your turn" : "Python")}
          <StatusDot tone={status.tone} text={status.text} />
        </span>

        {editable && (
          <>
            <IconButton onClick={handleCopy} title="Copy code">
              {copied ? <Check /> : <Copy />}
            </IconButton>
            <IconButton onClick={handleReset} title="Reset to the starting code">
              <Reset />
            </IconButton>
          </>
        )}

        {running ? (
          <button
            onClick={handleStop}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ background: "#dc2626" }}
          >
            <Stop /> Stop
          </button>
        ) : (
          <button
            onClick={doRun}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            <Play /> Run
            <kbd className="ml-1 hidden rounded px-1 py-px text-[10px] opacity-70 sm:inline" style={{ background: "color-mix(in oklab, currentColor 18%, transparent)" }}>
              ⌘↵
            </kbd>
          </button>
        )}
      </div>

      {/* Editor */}
      <div ref={host} style={{ minHeight: minHeight ? `${minHeight}px` : undefined }} />

      {/* Stdin */}
      {editable && (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setShowStdin((v) => !v)}
            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors"
            style={{ color: "var(--text-faint)" }}
          >
            <ChevronDown className={`transition-transform ${showStdin ? "" : "-rotate-90"}`} width={12} height={12} />
            Stdin {stdin ? `(${stdin.split("\n").length} lines)` : "— for input()"}
          </button>
          {showStdin && (
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              spellCheck={false}
              rows={3}
              placeholder="One value per line, read in order by input()"
              className="w-full resize-y px-3 pb-2 font-mono text-[13px] outline-none"
              style={{ background: "transparent", color: "var(--text)" }}
            />
          )}
        </div>
      )}

      {/* Output */}
      {(lines.length > 0 || result) && (
        <div className="border-t" style={{ borderColor: "var(--border)", background: "var(--code-bg)" }}>
          <div className="flex items-center justify-between px-3 pt-2 text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            <span>Output</span>
            {result && <span>{result.elapsed} ms</span>}
          </div>
          <pre className="max-h-80 overflow-auto px-3 pb-3 pt-1 font-mono text-[12.5px] leading-relaxed">
            {lines.map((line, i) => (
              <span
                key={i}
                style={{
                  color:
                    line.stream === "stderr" ? "#f87171" : line.stream === "meta" ? "var(--text-faint)" : "var(--text)",
                }}
              >
                {line.text}
              </span>
            ))}
            {result?.ok === false && result.error && (
              <span style={{ color: "#f87171" }}>{result.error}</span>
            )}
            {lines.length === 0 && result?.ok && !result.error && (
              <span style={{ color: "var(--text-faint)" }}>
                Ran cleanly with no output. Add a <code>print(...)</code> to see a value.
              </span>
            )}
          </pre>
        </div>
      )}

      {/* Exercise verdict */}
      {exercise && result && (
        <div
          className="flex items-start gap-2 border-t px-3 py-2.5 text-[13px]"
          style={{
            borderColor: "var(--border)",
            background: passed
              ? "color-mix(in oklab, #22c55e 12%, transparent)"
              : "color-mix(in oklab, #ef4444 10%, transparent)",
          }}
        >
          <span className="mt-0.5" style={{ color: passed ? "#16a34a" : "#dc2626" }}>
            {passed ? <Check /> : <Cross />}
          </span>
          <div className="min-w-0 flex-1">
            {passed ? (
              <strong style={{ color: "#16a34a" }}>Correct — all checks passed.</strong>
            ) : (
              <>
                <strong style={{ color: "#dc2626" }}>Not quite yet.</strong>{" "}
                <span style={{ color: "var(--text-muted)" }}>
                  {failed ? "A check failed:" : "Your code raised an error before the checks could run."}
                </span>
                {failed && (
                  <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono text-[12px]" style={{ color: "var(--text-muted)" }}>
                    {result.tests?.error}
                  </pre>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Hint / solution */}
      {exercise && (hint || solution) && (
        <div className="flex flex-wrap gap-2 border-t px-3 py-2" style={{ borderColor: "var(--border)" }}>
          {hint && (
            <button
              onClick={() => setShowHint((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium"
              style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}
            >
              <Lightbulb width={13} height={13} /> {showHint ? "Hide hint" : "Hint"}
            </button>
          )}
          {solution && (
            <button
              onClick={() => {
                replaceDoc(solution);
                setShowSolution(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium"
              style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}
            >
              {showSolution ? "Solution loaded" : "Show solution"}
            </button>
          )}
          {showHint && hint && (
            <p className="w-full pt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function IconButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-lg border p-1.5 transition-colors"
      style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}
    >
      {children}
    </button>
  );
}

function StatusDot({ tone, text }: { tone: "idle" | "busy" | "ok" | "bad"; text: string }) {
  const color = { idle: "var(--text-faint)", busy: "#f59e0b", ok: "#22c55e", bad: "#ef4444" }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-normal" style={{ color: "var(--text-faint)" }}>
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${tone === "busy" ? "animate-pulse" : ""}`}
        style={{ background: color }}
      />
      {text}
    </span>
  );
}
