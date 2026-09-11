import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "../lib/search";
import { Search } from "./icons";

interface Hit {
  href: string;
  title: string;
  context: string;
  moduleTitle: string;
  /** Lower sorts first. */
  rank: number;
  /** Full-text matches come from Pagefind; the rest from the embedded index. */
  source: "index" | "pagefind";
}

interface PagefindResult {
  id: string;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta?: { title?: string };
  }>;
}

interface Pagefind {
  search: (term: string) => Promise<{ results: PagefindResult[] }>;
  options?: (config: Record<string, unknown>) => Promise<void>;
}

/** Where `pagefind.js` lands in the built site, base path included. */
function pagefindUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/pagefind/pagefind.js`;
}

/**
 * Loads Pagefind once, and remembers that it is unavailable so the dev server
 * does not retry on every keystroke.
 */
let pagefindPromise: Promise<Pagefind | null> | null = null;
function loadPagefind(): Promise<Pagefind | null> {
  if (!pagefindPromise) {
    pagefindPromise = import(/* @vite-ignore */ pagefindUrl())
      .then(async (module: Pagefind) => {
        await module.options?.({ excerptLength: 24 });
        return module;
      })
      .catch(() => null);
  }
  return pagefindPromise;
}

/**
 * Scores a lesson against the query.
 *
 * Every word has to appear somewhere, so a two-word query narrows rather than
 * widens. Where it appears decides the rank: a title match beats a description
 * match beats an objective.
 */
function scoreEntry(entry: SearchEntry, words: string[]): number | null {
  const title = entry.title.toLowerCase();
  const description = entry.description.toLowerCase();
  const module = entry.moduleTitle.toLowerCase();
  const objectives = entry.objectives.join(" ").toLowerCase();

  let score = 0;
  for (const word of words) {
    if (title.startsWith(word)) score += 0;
    else if (title.includes(word)) score += 1;
    else if (module.includes(word)) score += 2;
    else if (description.includes(word)) score += 3;
    else if (objectives.includes(word)) score += 4;
    else return null;
  }
  return score;
}

export default function CommandPalette({ entries }: { entries: SearchEntry[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fullText, setFullText] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);

  const input = useRef<HTMLInputElement>(null);
  const listbox = useRef<HTMLUListElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    restoreFocus.current = document.activeElement as HTMLElement;
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    setQuery("");
    setFullText([]);
    setActive(0);
    restoreFocus.current?.focus();
  }, []);

  // Cmd/Ctrl+K anywhere, or "/" when not already typing somewhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable ||
        target?.closest(".cm-editor") !== null;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open ? hide() : show();
      } else if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, show, hide]);

  useEffect(() => {
    if (open) input.current?.focus();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Title, description and objective matches, straight from the embedded index.
  const titleHits = useMemo<Hit[]>(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return entries.slice(0, 8).map((entry) => ({
        href: entry.href,
        title: entry.title,
        context: entry.description,
        moduleTitle: entry.moduleTitle,
        rank: 0,
        source: "index" as const,
      }));
    }
    return entries
      .map((entry) => ({ entry, score: scoreEntry(entry, words) }))
      .filter((scored): scored is { entry: SearchEntry; score: number } => scored.score !== null)
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map(({ entry, score }) => ({
        href: entry.href,
        title: entry.title,
        context: entry.description,
        moduleTitle: entry.moduleTitle,
        rank: score,
        source: "index" as const,
      }));
  }, [entries, query]);

  // Full-text matches over the lesson bodies, when the index has been built.
  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 3) {
      setFullText([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const pagefind = await loadPagefind();
      if (!pagefind || cancelled) return;

      const { results } = await pagefind.search(term);
      const resolved = await Promise.all(results.slice(0, 6).map((result) => result.data()));
      if (cancelled) return;

      setFullText(
        resolved.map((data) => ({
          href: data.url,
          title: data.meta?.title ?? data.url,
          context: data.excerpt.replace(/<[^>]+>/g, ""),
          moduleTitle: "in the lesson text",
          rank: 100,
          source: "pagefind" as const,
        }))
      );
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const hits = useMemo(() => {
    const seen = new Set(titleHits.map((hit) => hit.href.replace(/\/$/, "")));
    const extra = fullText.filter((hit) => !seen.has(hit.href.replace(/\/$/, "")));
    return [...titleHits, ...extra];
  }, [titleHits, fullText]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listbox.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({
      block: "nearest",
    });
  }, [active, hits.length]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      hide();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (hits.length ? (current + 1) % hits.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (hits.length ? (current - 1 + hits.length) % hits.length : 0));
    } else if (event.key === "Enter" && hits[active]) {
      event.preventDefault();
      window.location.href = hits[active].href;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="hover-nav flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[13px]"
        style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}
        aria-label="Search lessons"
      >
        <Search width={14} height={14} />
        <span className="hidden md:inline">Search</span>
        <kbd
          className="ml-1 hidden rounded px-1 py-px text-[10px] md:inline"
          style={{ background: "var(--bg-sunken)", color: "var(--text-faint)" }}
        >
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          style={{ background: "color-mix(in oklab, #000 55%, transparent)" }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) hide();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search lessons"
            className="w-full max-w-xl overflow-hidden rounded-xl2 border shadow-2xl"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-strong)" }}
          >
            <div
              className="flex items-center gap-2.5 border-b px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              <Search width={16} height={16} />
              <input
                ref={input}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search lessons…"
                spellCheck={false}
                autoComplete="off"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-results"
                aria-activedescendant={hits[active] ? `palette-hit-${active}` : undefined}
                className="w-full bg-transparent text-[15px] outline-none"
                style={{ color: "var(--text)" }}
              />
              <kbd
                className="rounded px-1.5 py-0.5 text-[10px]"
                style={{ background: "var(--bg-sunken)", color: "var(--text-faint)" }}
              >
                esc
              </kbd>
            </div>

            <ul id="palette-results" ref={listbox} role="listbox" className="max-h-[52vh] overflow-y-auto">
              {hits.length === 0 && (
                <li className="px-4 py-6 text-center text-[14px]" style={{ color: "var(--text-faint)" }}>
                  No lesson matches “{query}”.
                </li>
              )}
              {hits.map((hit, index) => (
                <li key={`${hit.source}-${hit.href}-${index}`}>
                  <a
                    id={`palette-hit-${index}`}
                    role="option"
                    aria-selected={index === active}
                    data-active={index === active}
                    href={hit.href}
                    onMouseEnter={() => setActive(index)}
                    className="block border-l-2 px-4 py-2.5"
                    style={{
                      borderLeftColor: index === active ? "var(--accent)" : "transparent",
                      background: index === active ? "var(--bg-sunken)" : "transparent",
                    }}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-[14.5px] font-medium" style={{ color: "var(--text)" }}>
                        {hit.title}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                        {hit.moduleTitle}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                      {hit.context}
                    </p>
                  </a>
                </li>
              ))}
            </ul>

            <div
              className="flex items-center gap-3 border-t px-4 py-2 text-[11px]"
              style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
            >
              <span>↑↓ to move</span>
              <span>↵ to open</span>
              <span className="ml-auto">{hits.length} result{hits.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
