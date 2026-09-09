/**
 * Main-thread client for the Pyodide worker.
 *
 * One worker is shared by every editor on the page: booting Pyodide costs
 * ~10 MB and a couple of seconds, so paying that once per page (not once per
 * code block) is the difference between usable and not.
 */

export type RunStream = "stdout" | "stderr";
export type RuntimePhase = "idle" | "downloading" | "starting" | "installing" | "ready" | "error";

export interface RunHandlers {
  onOutput: (stream: RunStream, text: string) => void;
}

export interface RunResult {
  ok: boolean;
  error?: string;
  elapsed: number;
  tests?: { ok: boolean; error?: string } | null;
}

export interface RunRequest {
  code: string;
  stdin?: string;
  tests?: string;
}

type StatusListener = (phase: RuntimePhase, detail: string) => void;

let worker: Worker | null = null;
let nextId = 1;
let phase: RuntimePhase = "idle";
let detail = "";

const statusListeners = new Set<StatusListener>();
const pending = new Map<number, { resolve: (r: RunResult) => void; handlers: RunHandlers }>();

function setPhase(next: RuntimePhase, nextDetail = "") {
  phase = next;
  detail = nextDetail;
  for (const listener of statusListeners) listener(phase, detail);
}

function workerUrl(): string {
  // BASE_URL is "/learn-python-ai/" in production and "/" in dev.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/pyodide-worker.js`;
}

function spawn(): Worker {
  const w = new Worker(workerUrl(), { type: "module" });

  w.onmessage = (event: MessageEvent) => {
    const msg = event.data;
    switch (msg?.type) {
      case "status":
        setPhase(msg.phase, msg.detail);
        break;
      case "ready":
        setPhase("ready", `Python ${msg.version}`);
        break;
      case "out":
        pending.get(msg.id)?.handlers.onOutput(msg.stream, msg.text);
        break;
      case "done": {
        const entry = pending.get(msg.id);
        pending.delete(msg.id);
        setPhase("ready", detail);
        entry?.resolve({
          ok: msg.ok,
          error: msg.error,
          elapsed: msg.elapsed,
          tests: msg.tests ?? null,
        });
        break;
      }
      case "fatal":
        setPhase("error", msg.error);
        for (const [, entry] of pending) {
          entry.resolve({ ok: false, error: msg.error, elapsed: 0 });
        }
        pending.clear();
        break;
    }
  };

  w.onerror = (event) => {
    setPhase("error", event.message || "The Python worker failed to start.");
  };

  return w;
}

/** Start downloading Pyodide now so the first Run feels instant. */
export function preload(): void {
  if (worker) return;
  worker = spawn();
  worker.postMessage({ type: "boot" });
}

export function subscribe(listener: StatusListener): () => void {
  statusListeners.add(listener);
  listener(phase, detail);
  return () => statusListeners.delete(listener);
}

export function run(request: RunRequest, handlers: RunHandlers): Promise<RunResult> {
  if (!worker) preload();
  const id = nextId++;
  return new Promise<RunResult>((resolve) => {
    pending.set(id, { resolve, handlers });
    worker!.postMessage({ type: "run", id, ...request });
  });
}

/**
 * Hard-stop a runaway program. WebAssembly has no safe way to interrupt a
 * synchronous `while True:` without SharedArrayBuffer (which GitHub Pages
 * cannot enable), so we kill the worker and boot a fresh one.
 */
export function stop(): void {
  if (!worker) return;
  worker.terminate();
  worker = null;
  for (const [, entry] of pending) {
    entry.resolve({ ok: false, error: "Execution stopped.", elapsed: 0 });
  }
  pending.clear();
  setPhase("idle", "");
  preload();
}

export const getPhase = () => ({ phase, detail });
