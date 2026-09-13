"use client";

import { useEffect } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";

export function LastVisitedTracker({
  chapterSlug,
  lessonSlug,
}: {
  chapterSlug: string;
  lessonSlug: string;
}) {
  const { setLastVisited } = useProgress();

  useEffect(() => {
    setLastVisited(chapterSlug, lessonSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterSlug, lessonSlug]);

  return null;
}
