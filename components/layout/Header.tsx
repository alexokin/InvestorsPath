import Link from "next/link";
import { BookOpen } from "lucide-react";
import { SearchTrigger } from "@/components/search/SearchTrigger";

const links = [
  { href: "/curriculum/", label: "תוכנית הלימודים" },
  { href: "/glossary/", label: "מילון מונחים" },
  { href: "/cheatsheets/", label: "דפי סיכום" },
  { href: "/tools/", label: "כלים" },
];

export function Header() {
  return (
    <header
      data-print-hide
      className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
          <BookOpen className="size-5 text-primary" />
          <span>מסלול המשקיע</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 font-medium text-muted transition-colors hover:bg-accent hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <SearchTrigger className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-muted transition-colors hover:border-primary hover:text-primary" />
      </div>
    </header>
  );
}
