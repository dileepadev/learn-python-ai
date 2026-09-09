/** Prefix a site-absolute path with the deploy base ("/learn-python-ai" in prod). */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export const lessonHref = (id: string): string => withBase(`/learn/${id}`);

export const SITE = {
  title: "Learn Python for AI",
  tagline: "Python, from your first print() to production AI systems.",
  description:
    "A free, hands-on course that takes you from complete beginner to AI engineer. Every lesson runs real Python in your browser — no installs, no setup.",
  repo: "https://github.com/dileepadev/learn-python-ai",
  author: "dileepadev",
} as const;
