import { useState } from "react";
import { Check, Cross } from "./icons";

export interface QuizChoice {
  text: string;
  correct?: boolean;
  /** Shown after answering — say *why*, not just "wrong". */
  why?: string;
}

export interface QuizProps {
  question: string;
  choices: QuizChoice[];
}

export default function Quiz({ question, choices }: QuizProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = answered && Boolean(choices[picked]?.correct);

  return (
    <section className="my-6 rounded-xl2 border p-4" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
      <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        Check yourself
      </p>
      <p className="mb-3 font-medium" style={{ color: "var(--text)" }}>{question}</p>

      <ul className="space-y-2">
        {choices.map((choice, i) => {
          const isPicked = picked === i;
          const reveal = answered && (isPicked || choice.correct);
          const good = Boolean(choice.correct);
          return (
            <li key={i}>
              <button
                onClick={() => !answered && setPicked(i)}
                disabled={answered}
                className="flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-[14px] transition-colors disabled:cursor-default"
                style={{
                  borderColor: reveal
                    ? good
                      ? "color-mix(in oklab, #22c55e 55%, var(--border))"
                      : "color-mix(in oklab, #ef4444 55%, var(--border))"
                    : "var(--border)",
                  background: reveal
                    ? good
                      ? "color-mix(in oklab, #22c55e 12%, transparent)"
                      : "color-mix(in oklab, #ef4444 10%, transparent)"
                    : "transparent",
                  color: "var(--text)",
                }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]"
                  style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}
                >
                  {reveal ? (good ? <Check width={11} height={11} /> : <Cross width={11} height={11} />) : String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0 flex-1">
                  {choice.text}
                  {reveal && choice.why && (
                    <span className="mt-1 block text-[13px]" style={{ color: "var(--text-muted)" }}>
                      {choice.why}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div className="mt-3 flex items-center gap-3 text-[13px]">
          <span style={{ color: correct ? "#16a34a" : "#dc2626" }}>
            {correct ? "That's right." : "Not this time — read the explanations above."}
          </span>
          <button
            onClick={() => setPicked(null)}
            className="rounded-md border px-2 py-0.5 text-[12px]"
            style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
