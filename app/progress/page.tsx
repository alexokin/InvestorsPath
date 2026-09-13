import type { Metadata } from "next";
import { getChapters } from "@/lib/content/loader";
import { ProgressDashboard, type DashboardChapter } from "@/components/progress/ProgressDashboard";

export const metadata: Metadata = {
  title: "ההתקדמות שלי",
  description: "מעקב אחר השיעורים שהושלמו, ציוני הבחנים, הסימניות וההערות שלכם במסלול המשקיע.",
};

export default function ProgressPage() {
  const chapters: DashboardChapter[] = getChapters().map((chapter) => ({
    slug: chapter.slug,
    title: chapter.title,
    href: chapter.href,
    lessons: chapter.lessons.map((lesson) => ({
      slug: lesson.slug,
      title: lesson.title,
      href: lesson.href,
      estimatedMinutes: lesson.estimatedMinutes,
    })),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">ההתקדמות שלי</h1>
      <p className="mt-2 text-muted">
        כל הנתונים נשמרים בדפדפן שלכם בלבד. אפשר לייצא אותם לקובץ ולייבא במכשיר אחר.
      </p>
      <div className="mt-8">
        <ProgressDashboard chapters={chapters} />
      </div>
    </div>
  );
}
