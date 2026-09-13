import { CheatSheet } from "@/components/lesson/CheatSheet";
import type { Chapter } from "@/lib/content/schema";

export function ChapterCheatSheet({ chapter }: { chapter: Chapter }) {
  return (
    <div className="space-y-4">
      <CheatSheet cheatsheet={chapter.cheatsheet} title={`דף סיכום — ${chapter.title}`} variant="print" />
      {chapter.lessons.map((lesson) => (
        <CheatSheet
          key={lesson.slug}
          cheatsheet={lesson.cheatsheet}
          title={lesson.title}
          variant="print"
        />
      ))}
    </div>
  );
}
