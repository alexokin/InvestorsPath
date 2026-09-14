import Link from "next/link";

const footerLinks = [
  { href: "/changelog/", label: "מה חדש" },
  { href: "/feed.xml", label: "RSS" },
  { href: "/progress/", label: "ההתקדמות שלי" },
  { href: "/tools/checklist/", label: "דף עבודה לניתוח חברה" },
];

export function Footer() {
  return (
    <footer data-print-hide className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted sm:px-6">
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-muted transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4">מסלול המשקיע — המדריך המלא להשקעות ערך, בעברית.</p>
        <p className="mt-1">
          התוכן באתר זה למטרות לימוד בלבד ואינו מהווה ייעוץ השקעות, ייעוץ מס או המלצה לפעולה.
        </p>
      </div>
    </footer>
  );
}
