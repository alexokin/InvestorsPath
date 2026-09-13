import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TableOfContents } from "@/components/layout/TableOfContents";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import type { Chapter } from "@/lib/content/schema";
import type { Heading } from "@/lib/content/mdx";

export function LessonLayout({
  chapter,
  headings,
  children,
}: {
  chapter: Chapter;
  headings: Heading[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <MobileDrawer>
        <Sidebar chapter={chapter} />
      </MobileDrawer>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)_200px]">
        <aside data-print-hide className="hidden lg:block">
          <div className="sticky top-20">
            <Sidebar chapter={chapter} />
          </div>
        </aside>
        <article className="min-w-0">{children}</article>
        <aside data-print-hide className="hidden lg:block">
          <div className="sticky top-20">
            <TableOfContents headings={headings} />
          </div>
        </aside>
      </div>
    </div>
  );
}
