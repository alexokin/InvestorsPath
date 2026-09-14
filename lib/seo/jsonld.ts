import { SITE_URL } from "@/lib/site";
import type { Chapter, Difficulty, Lesson, QuizQuestion } from "@/lib/content/schema";
import type { GlossaryEntry } from "@/lib/content/glossary";

const SITE_NAME = "מסלול המשקיע";

/** `estimatedMinutes` -> ISO 8601 duration (e.g. 45 -> "PT45M"). */
function minutesToIso8601(minutes: number): string {
  return `PT${Math.max(0, Math.round(minutes))}M`;
}

const EDUCATIONAL_LEVEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function absoluteUrl(href: string): string {
  return new URL(href, SITE_URL).toString();
}

/**
 * schema.org `Course` for the whole site, with one `CourseInstance` (mode:
 * online) and a `hasPart` entry per chapter. Inserted on the home page.
 */
export function courseJsonLd(chapters: Chapter[]) {
  const totalMinutes = chapters.reduce((sum, c) => sum + c.estimatedMinutes, 0);

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: SITE_NAME,
    description: "המדריך המלא להשקעות ערך, בעברית",
    inLanguage: "he",
    url: SITE_URL,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: minutesToIso8601(totalMinutes),
    },
    hasPart: chapters.map((chapter) => ({
      "@type": "Course",
      name: chapter.title,
      description: chapter.description,
      url: absoluteUrl(chapter.href),
    })),
  };
}

/**
 * schema.org `Course` for a single chapter, marked as `isPartOf` the site's
 * main Course. Inserted on the chapter page.
 */
export function chapterJsonLd(chapter: Chapter) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: chapter.title,
    description: chapter.description,
    inLanguage: "he",
    url: absoluteUrl(chapter.href),
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    isPartOf: {
      "@type": "Course",
      name: SITE_NAME,
      url: SITE_URL,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: minutesToIso8601(chapter.estimatedMinutes),
    },
  };
}

/**
 * schema.org `LearningResource` for a single lesson, linked back to its
 * chapter via `isPartOf`. Inserted on the lesson page.
 */
export function lessonJsonLd(lesson: Lesson, chapter: Chapter) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.description,
    inLanguage: "he",
    url: absoluteUrl(lesson.href),
    educationalLevel: EDUCATIONAL_LEVEL[lesson.difficulty],
    timeRequired: minutesToIso8601(lesson.estimatedMinutes),
    isPartOf: {
      "@type": "Course",
      name: chapter.title,
      url: absoluteUrl(chapter.href),
    },
  };
}

/**
 * schema.org `FAQPage` built from a lesson's quiz: each question becomes a
 * `Question`, and its correct option + explanation becomes the
 * `acceptedAnswer`. Returns `null` for an empty quiz (schema validators, and
 * FAQPage) so callers can skip rendering the tag entirely.
 */
export function faqJsonLd(quiz: QuizQuestion[]) {
  if (quiz.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: quiz.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${q.options[q.answer]} — ${q.explanation}`,
      },
    })),
  };
}

export interface BreadcrumbItem {
  label: string;
  /** Site-relative href (e.g. "/curriculum/"); omitted for the current page. */
  href?: string;
}

/** schema.org `BreadcrumbList` from the same items rendered by <Breadcrumbs>. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

/** schema.org `ItemList` of chapters, in curriculum order. Used on /curriculum/. */
export function chapterListJsonLd(chapters: Chapter[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: chapters.map((chapter, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: chapter.title,
      url: absoluteUrl(chapter.href),
    })),
  };
}

/** schema.org `DefinedTermSet` for the glossary, one `DefinedTerm` per entry. */
export function glossaryJsonLd(entries: GlossaryEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "מילון מונחים — מסלול המשקיע",
    inLanguage: "he",
    url: absoluteUrl("/glossary/"),
    hasDefinedTerm: entries.map((entry) => ({
      "@type": "DefinedTerm",
      name: entry.term,
      alternateName: entry.en,
      description: entry.definition,
      url: `${absoluteUrl("/glossary/")}#${entry.slug}`,
    })),
  };
}
