import { MODULE_BY_SLUG, moduleIndex } from "./curriculum";
import { allLessons } from "./lessons";
import { lessonHref } from "./paths";

export interface SearchEntry {
  id: string;
  title: string;
  description: string;
  module: string;
  moduleTitle: string;
  level: string;
  objectives: string[];
  href: string;
}

/**
 * Every lesson, flattened for the command palette.
 *
 * This is embedded in the page, so titles, descriptions and objectives are
 * searchable the moment the palette opens — including on the dev server, where
 * the Pagefind index does not exist. Pagefind then adds full-text matches over
 * the lesson bodies when it is available.
 */
export async function searchIndex(): Promise<SearchEntry[]> {
  const lessons = await allLessons();
  return lessons
    .map((lesson) => ({
      id: lesson.id,
      title: lesson.data.title,
      description: lesson.data.description,
      module: lesson.data.module,
      moduleTitle: MODULE_BY_SLUG.get(lesson.data.module)?.title ?? lesson.data.module,
      level: lesson.data.level,
      objectives: lesson.data.objectives,
      href: lessonHref(lesson.id),
    }))
    .sort((a, b) => moduleIndex(a.module) - moduleIndex(b.module));
}
