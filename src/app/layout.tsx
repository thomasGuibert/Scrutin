import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { Footer } from "@/app/_components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrutins",
  description:
    "Consultez les votes réels de l'Assemblée nationale, classés par thème.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <header className="masthead">
          <div className="measure">
            <div className="masthead-row">
              <Link className="wordmark" href="/">
                Scrutins <span className="rule">·</span> Au-delà du discours
              </Link>
              <p className="masthead-meta">
                17e législature — Assemblée nationale
              </p>
            </div>
          </div>
        </header>
        <div className="measure">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
