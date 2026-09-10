/**
 * The course map: eight modules taking a complete beginner to shipping
 * AI systems in Python.
 *
 * Modules with `status: "published"` have lessons in src/content/lessons/.
 * The rest are the public roadmap — they render on /curriculum with their
 * planned lessons so learners can see where the track goes.
 */

export type Level = "beginner" | "intermediate" | "advanced" | "expert";
export type ModuleStatus = "published" | "in-progress" | "planned";

export interface Module {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: Level;
  status: ModuleStatus;
  icon: string;
  /** Lesson titles for modules that are not written yet. */
  plannedLessons?: string[];
}

export const LEVELS: Record<Level, { label: string; blurb: string }> = {
  beginner: { label: "Beginner", blurb: "No programming experience assumed" },
  intermediate: { label: "Intermediate", blurb: "You can write and read basic Python" },
  advanced: { label: "Advanced", blurb: "Comfortable with functions, classes and modules" },
  expert: { label: "Expert", blurb: "Building real systems for production" },
};

export const MODULES: Module[] = [
  {
    slug: "foundations",
    title: "Python Foundations",
    tagline: "The language, from `print` to control flow",
    description:
      "Everything you need to read and write ordinary Python: values, names, operators, the four core collections, and the statements that make a program branch and repeat. Every page runs in your browser.",
    level: "beginner",
    status: "published",
    icon: "sparkles",
  },
  {
    slug: "core-python",
    title: "Core Python",
    tagline: "Functions, objects, and the shape of real code",
    description:
      "Move from scripts to software. Functions and scope, comprehensions and generators, modules and virtual environments, files and JSON, exceptions, classes and dataclasses, and the type hints that every AI codebase leans on.",
    level: "intermediate",
    status: "published",
    icon: "layers",
  },
  {
    slug: "numerical-python",
    title: "Numerical Python",
    tagline: "NumPy, vectorisation, and thinking in arrays",
    description:
      "The mental model that separates people who use ML libraries from people who understand them: shapes, dtypes, broadcasting, and why a vectorised expression beats a Python loop by two orders of magnitude.",
    level: "intermediate",
    status: "published",
    icon: "grid",
  },
  {
    slug: "data-wrangling",
    title: "Data Wrangling",
    tagline: "pandas, cleaning, and honest exploration",
    description:
      "Real datasets are messy, and most of an AI project is spent here. Load, reshape, join, group, and visualise data — and learn the failure modes that quietly poison a model downstream.",
    level: "intermediate",
    status: "published",
    icon: "table",
  },
  {
    slug: "ml-foundations",
    title: "Machine Learning Foundations",
    tagline: "scikit-learn, and a neural net you write yourself",
    description:
      "Fit your first models, then take the lid off. Train/test discipline, pipelines, metrics that match the problem, and gradient descent and backpropagation implemented from scratch in NumPy.",
    level: "advanced",
    status: "published",
    icon: "activity",
  },
  {
    slug: "llm-engineering",
    title: "LLM Engineering",
    tagline: "Prompts, structured output, and tool-calling loops",
    description:
      "Working with a large language model as a component in a program. The Messages API, streaming, system prompts, structured JSON output, tool use, and the agent loop that turns a model into something that acts.",
    level: "advanced",
    status: "planned",
    icon: "message",
    plannedLessons: [
      "How an LLM API call actually works",
      "The Anthropic Python SDK: messages and streaming",
      "System prompts, few-shot examples and prompt files",
      "Structured output and schema validation with Pydantic",
      "Tool use and the function-calling loop",
      "Building an agent loop from first principles",
      "The Model Context Protocol (MCP)",
      "Token accounting, caching and cost control",
    ],
  },
  {
    slug: "rag-and-retrieval",
    title: "Retrieval and RAG",
    tagline: "Embeddings, vector search, and grounded answers",
    description:
      "Give a model access to knowledge it was never trained on. Chunking strategies, embeddings, vector indexes, hybrid and re-ranked retrieval, and how to evaluate whether the answer was actually grounded.",
    level: "expert",
    status: "planned",
    icon: "search",
    plannedLessons: [
      "Embeddings and vector similarity",
      "Chunking strategies that survive contact with real documents",
      "Building a vector index",
      "Hybrid search: dense plus keyword",
      "Re-ranking and context assembly",
      "A complete RAG pipeline",
      "Measuring groundedness and retrieval quality",
    ],
  },
  {
    slug: "production-ai",
    title: "Production AI Systems",
    tagline: "Async, testing, evals, and shipping it",
    description:
      "The engineering that separates a notebook from a service. asyncio and concurrent API calls, retries and rate limits, pytest for non-deterministic systems, evaluation harnesses, observability, packaging and deployment.",
    level: "expert",
    status: "planned",
    icon: "rocket",
    plannedLessons: [
      "asyncio: concurrency for I/O-bound AI workloads",
      "Retries, timeouts, backoff and rate limits",
      "Testing non-deterministic systems with pytest",
      "Building an evaluation harness",
      "LLM-as-judge, and its failure modes",
      "Structured logging, tracing and observability",
      "Serving models with FastAPI",
      "Packaging, dependency pinning and reproducibility",
      "Cost, latency and capacity planning",
    ],
  },
];

export const MODULE_BY_SLUG = new Map(MODULES.map((m) => [m.slug, m]));

export const moduleIndex = (slug: string): number =>
  MODULES.findIndex((m) => m.slug === slug);
