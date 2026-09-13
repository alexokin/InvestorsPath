import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProgressProvider } from "@/components/progress/ProgressProvider";
import { CurrencyProvider } from "@/components/calculators/CurrencyProvider";
import { SearchProvider } from "@/components/search/SearchProvider";
import { SearchDialog } from "@/components/search/SearchDialog";
import { SITE_URL } from "@/lib/site";
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
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "מסלול המשקיע",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
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
      </body>
    </html>
  );
}
