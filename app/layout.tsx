import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProgressProvider } from "@/components/progress/ProgressProvider";
import { CurrencyProvider } from "@/components/calculators/CurrencyProvider";
import { SearchProvider } from "@/components/search/SearchProvider";
import { SearchDialog } from "@/components/search/SearchDialog";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { Analytics } from "@/components/analytics/Analytics";
import { SITE_URL } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700"],
});

const SITE_TITLE = "מסלול המשקיע — המדריך המלא להשקעות ערך, בעברית";
const SITE_DESCRIPTION = "המדריך המלא להשקעות ערך, בעברית";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | מסלול המשקיע",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "מסלול המשקיע",
  },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/feed.xml" },
  },
  twitter: { card: "summary_large_image" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "מסלול המשקיע",
    locale: "he_IL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs synchronously before first paint so the stored/system theme is applied without a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ProgressProvider>
          <CurrencyProvider>
            <SearchProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <SearchDialog />
            </SearchProvider>
          </CurrencyProvider>
        </ProgressProvider>
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}
