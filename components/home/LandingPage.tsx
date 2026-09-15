import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const learnBullets = [
  "מהי השקעת ערך ולמה היא עובדת לאורך זמן, בשונה מספקולציה או מסחר יומי.",
  "איך מעריכים שווי הוגן של חברה — תזרים מזומנים מהוון, מכפילים ושיטות השוואה.",
  "איך מנתחים דוחות כספיים ומזהים חברות איכותיות עם יתרון תחרותי בר-קיימא.",
  "איך בונים תיק השקעות מפוזר, מנהלים סיכונים ושומרים על משמעת לאורך זמן.",
];

type LandingPageProps = {
  chapterTitles: string[];
  totalLessons: number;
  totalMinutes: number;
};

export function LandingPage({ chapterTitles, totalLessons, totalMinutes }: LandingPageProps) {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-xl font-bold text-foreground">מה תלמדו</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {learnBullets.map((bullet) => (
            <li
              key={bullet}
              className="rounded-xl border border-border bg-surface p-5 text-sm text-muted"
            >
              {bullet}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="text-center">
            <p className="text-3xl font-bold text-primary">12</p>
            <p className="mt-1 text-sm text-muted">פרקים</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-primary">{totalLessons}</p>
            <p className="mt-1 text-sm text-muted">שיעורים</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl font-bold text-primary">{totalMinutes}</p>
            <p className="mt-1 text-sm text-muted">דקות</p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-xl font-bold text-foreground">פרקי הקורס</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chapterTitles.map((title, i) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs font-semibold text-primary">פרק {i + 1}</p>
              <h3 className="mt-1 font-bold text-foreground">{title}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6">
        <LinkButton href="/login/">התחברות והתחלת הקורס</LinkButton>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 text-sm text-muted sm:px-6">
        <p>
          התוכן באתר זה למטרות לימוד בלבד ואינו מהווה ייעוץ השקעות, ייעוץ מס או המלצה לפעולה.
        </p>
      </section>
    </>
  );
}
