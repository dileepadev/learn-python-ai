/**
 * Per-browser learning progress. No account, no backend — a static site on
 * GitHub Pages has nowhere to put one, and localStorage is enough to make
 * "pick up where I left off" work.
 */

const KEY = "lpai:progress:v1";

export interface Progress {
  completed: string[];
  lastVisited?: string;
  updatedAt?: number;
}

const EMPTY: Progress = { completed: [] };

function read(): Progress {
  if (typeof localStorage === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Progress;
    return { ...EMPTY, ...parsed, completed: parsed.completed ?? [] };
  } catch {
    return EMPTY;
  }
}

function write(next: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...next, updatedAt: Date.now() }));
    window.dispatchEvent(new CustomEvent("lpai:progress", { detail: next }));
  } catch {
    // Private browsing or blocked site data — progress just won't persist.
  }
}

export const getProgress = read;

export const isComplete = (slug: string): boolean => read().completed.includes(slug);

export function setComplete(slug: string, complete: boolean): Progress {
  const current = read();
  const completed = new Set(current.completed);
  if (complete) completed.add(slug);
  else completed.delete(slug);
  const next: Progress = { ...current, completed: [...completed] };
  write(next);
  return next;
}

export function markVisited(slug: string): void {
  const current = read();
  if (current.lastVisited === slug) return;
  write({ ...current, lastVisited: slug });
}

export function reset(): void {
  write({ completed: [] });
}

export function onChange(listener: (p: Progress) => void): () => void {
  const handler = () => listener(read());
  window.addEventListener("lpai:progress", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("lpai:progress", handler);
    window.removeEventListener("storage", handler);
  };
}
