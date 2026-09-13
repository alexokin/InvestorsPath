import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

export type RelatedLinkItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

/**
 * A titled list of card-style links, used at the bottom of a lesson for
 * "related lessons" and "related tools". Renders nothing when `items` is empty.
 */
export function RelatedLinks({
  title,
  items,
  className,
}: {
  title: string;
  items: RelatedLinkItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className={className}>
      <h2 className="mb-3 text-lg font-bold text-foreground">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-sm text-foreground transition-colors hover:border-primary hover:bg-accent"
              >
                {Icon && <Icon className="size-4 shrink-0 text-primary" />}
                <span className="flex-1">{item.label}</span>
                <ArrowLeft className="size-4 shrink-0 text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
