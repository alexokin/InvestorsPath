import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { WorksheetApp } from "@/components/worksheet/WorksheetApp";

export const metadata: Metadata = {
  title: "דף עבודה לניתוח חברה",
  description:
    "דף עבודה אינטראקטיבי שהופך את הצ'קליסט לפני קנייה לתהליך מובנה: ממלאים לפי סעיפים, כותבים תזה, ומקבלים מסקנה מתועדת לכל חברה.",
};

export default function ChecklistPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[{ label: "כלים ומחשבונים", href: "/tools/" }, { label: "דף עבודה" }]}
      />
      <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
        דף עבודה לניתוח חברה
      </h1>
      <p className="mt-2 text-muted">
        הכלי הזה הופך את הצ&apos;קליסט לפני קנייה לתהליך עבודה מובנה: פותחים דף עבודה חדש לכל
        חברה שבודקים, עוברים על שישה סעיפים — הבנת העסק, חפיר תחרותי, איכות ההנהלה, מאזן
        ותזרים, הערכת שווי ומרווח ביטחון, וסיכונים ודגלים אדומים — ומסמנים כל שאלה כ&quot;כן&quot;,
        &quot;לא&quot; או &quot;לא בטוח&quot; עם הערה אישית. הדף נשמר אוטומטית בדפדפן שלכם,
        וניתן לייצא אותו כקובץ או להדפיס אותו לפני קבלת החלטה.
      </p>

      <WorksheetApp />
    </div>
  );
}
