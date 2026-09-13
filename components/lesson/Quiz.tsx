"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import type { QuizQuestion } from "@/lib/content/schema";

export function Quiz({
  chapterSlug,
  lessonSlug,
  questions,
}: {
  chapterSlug: string;
  lessonSlug: string;
  questions: QuizQuestion[];
}) {
  const { setQuizResult } = useProgress();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);
  const correctCount = questions.filter((q, i) => answers[i] === q.answer).length;

  function submit() {
    setSubmitted(true);
    setQuizResult(chapterSlug, lessonSlug, correctCount, questions.length);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => {
        const selected = answers[qi];
        return (
          <div key={qi} className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-3 font-medium text-foreground">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((option, oi) => {
                const isSelected = selected === oi;
                const isCorrect = q.answer === oi;
                const showState = submitted && (isSelected || isCorrect);
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                    className={[
                      "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start text-sm transition-colors",
                      submitted
                        ? isCorrect
                          ? "border-emerald-300 bg-emerald-50"
                          : isSelected
                            ? "border-red-300 bg-red-50"
                            : "border-border"
                        : isSelected
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary",
                    ].join(" ")}
                  >
                    <span>{option}</span>
                    {showState &&
                      (isCorrect ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      ) : isSelected ? (
                        <XCircle className="size-4 shrink-0 text-red-600" />
                      ) : null)}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <p className="mt-2 text-sm text-muted">{q.explanation}</p>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={submit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            בדיקת תשובות
          </button>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">
              קיבלת {correctCount} מתוך {questions.length} נכונות
            </p>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-primary"
            >
              <RotateCcw className="size-3.5" />
              נסה שוב
            </button>
          </>
        )}
      </div>
    </div>
  );
}
