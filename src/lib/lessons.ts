import { getCollection, type CollectionEntry } from "astro:content";
import { MODULES, moduleIndex } from "./curriculum";

export type Lesson = CollectionEntry<"lessons">;

const byCourseOrder = (a: Lesson, b: Lesson) => {
  const moduleDelta = moduleIndex(a.data.module) - moduleIndex(b.data.module);
  return moduleDelta !== 0 ? moduleDelta : a.data.order - b.data.order;
};

/** Every publishable lesson, in the order a learner should meet them. */
export async function allLessons(): Promise<Lesson[]> {
  const entries = await getCollection("lessons", ({ data }) =>
    import.meta.env.PROD ? !data.draft : true
  );
  return entries.sort(byCourseOrder);
}

export async function lessonsByModule(): Promise<Map<string, Lesson[]>> {
  const grouped = new Map<string, Lesson[]>();
  for (const module of MODULES) grouped.set(module.slug, []);
  for (const lesson of await allLessons()) {
    grouped.get(lesson.data.module)?.push(lesson);
  }
  return grouped;
}

export interface Neighbours {
  previous: Lesson | null;
  next: Lesson | null;
  position: number;
  total: number;
}

export async function neighbours(id: string): Promise<Neighbours> {
  const lessons = await allLessons();
  const index = lessons.findIndex((lesson) => lesson.id === id);
  return {
    previous: index > 0 ? lessons[index - 1]! : null,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1]! : null,
    position: index + 1,
    total: lessons.length,
  };
}
