import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">הדף לא נמצא</h1>
      <p className="mt-2 text-muted">
        ייתכן שהקישור שגוי או שהדף הוסר. אפשר לחזור לעמוד הבית או לתוכנית הלימודים.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          עמוד הבית
        </Link>
        <Link
          href="/curriculum/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
        >
          תוכנית הלימודים
        </Link>
      </div>
    </div>
  );
}
