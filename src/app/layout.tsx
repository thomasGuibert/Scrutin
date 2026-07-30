import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrutin",
  description:
    "Consultez les votes réels de l'Assemblée nationale, classés par thème, sans jugement de valeur.",
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
                Scrutin <span className="rule">·</span> Au-delà du discours
              </Link>
              <p className="masthead-meta">
                17e législature — Assemblée nationale
              </p>
            </div>
          </div>
        </header>
        <div className="measure">{children}</div>
      </body>
    </html>
  );
}
