import { useState } from "react";
import CodeRunner from "./CodeRunner";

interface Preset {
  id: string;
  name: string;
  note: string;
  code: string;
}

const PRESETS: Preset[] = [
  {
    id: "blank",
    name: "Blank",
    note: "An empty file. Standard library included.",
    code: `# A full Python interpreter, running in this tab.\n\nprint("Hello from Python")\n`,
  },
  {
    id: "stdlib",
    name: "Standard library",
    note: "No downloads — everything here ships with Python.",
    code: `import json, math, random, statistics
from collections import Counter
from datetime import datetime, timedelta

random.seed(42)
samples = [random.gauss(mu=100, sigma=15) for _ in range(1000)]

print("mean  ", round(statistics.mean(samples), 2))
print("stdev ", round(statistics.stdev(samples), 2))
print("median", round(statistics.median(samples), 2))

words = "the quick brown fox jumps over the lazy dog the fox".split()
print("\\ntop words:", Counter(words).most_common(3))

payload = {"model": "demo", "ok": True, "score": round(math.pi, 4)}
print("\\njson:", json.dumps(payload, indent=2))
`,
  },
  {
    id: "numpy",
    name: "NumPy",
    note: "Downloads NumPy on first run (~7 MB), then cached.",
    code: `import numpy as np

rng = np.random.default_rng(0)

# A tiny linear-regression fit, closed form.
X = rng.normal(size=(200, 3))
true_w = np.array([2.0, -1.5, 0.5])
y = X @ true_w + rng.normal(scale=0.1, size=200)

# Normal equation: w = (XᵀX)⁻¹ Xᵀy
w = np.linalg.solve(X.T @ X, X.T @ y)

print("true weights     ", true_w)
print("recovered weights", np.round(w, 3))
print("max error        ", np.abs(w - true_w).max().round(4))

# Broadcasting: no Python loop anywhere.
grid = np.arange(1, 6)
print("\\nouter product:\\n", grid[:, None] * grid[None, :])
`,
  },
  {
    id: "pandas",
    name: "pandas",
    note: "Downloads pandas on first run (~12 MB).",
    code: `import pandas as pd

runs = pd.DataFrame({
    "model":   ["baseline", "baseline", "tuned", "tuned", "ensemble", "ensemble"],
    "split":   ["val", "test", "val", "test", "val", "test"],
    "accuracy":[0.71, 0.69, 0.89, 0.88, 0.92, 0.91],
    "latency_ms":[12, 12, 48, 47, 190, 195],
})

print(runs, "\\n")

summary = (
    runs.groupby("model")
        .agg(accuracy=("accuracy", "mean"), latency_ms=("latency_ms", "mean"))
        .sort_values("accuracy", ascending=False)
)
summary["acc_per_ms"] = (summary.accuracy / summary.latency_ms).round(5)
print(summary)
`,
  },
  {
    id: "sklearn",
    name: "scikit-learn",
    note: "Large first download (~25 MB). Worth it.",
    code: `from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

X, y = make_classification(n_samples=800, n_features=12, n_informative=5, random_state=0)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)

model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=500))
model.fit(X_train, y_train)

print(classification_report(y_test, model.predict(X_test), digits=3))
`,
  },
];

export default function Playground() {
  const [preset, setPreset] = useState<Preset>(PRESETS[0]!);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {PRESETS.map((item) => {
          const active = item.id === preset.id;
          return (
            <button
              key={item.id}
              onClick={() => setPreset(item)}
              className="rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors"
              style={{
                borderColor: active ? "var(--accent)" : "var(--border-strong)",
                background: active ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "transparent",
                color: active ? "var(--text)" : "var(--text-muted)",
              }}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <p className="mb-2 text-[13px]" style={{ color: "var(--text-faint)" }}>
        {preset.note} Your edits to each preset are kept in this browser.
      </p>

      {/* Remounting on preset change gives each one its own saved draft. */}
      <CodeRunner
        key={preset.id}
        id={`playground-${preset.id}`}
        code={preset.code}
        label={preset.name}
        minHeight={420}
      />
    </div>
  );
}
